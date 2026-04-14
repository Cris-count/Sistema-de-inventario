package com.inventario.service.onboarding;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.web.dto.onboarding.OnboardingDtos.EmpresaOnboardingDto;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.PublicPlanResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.SuperAdminOnboardingDto;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private static final String PIN_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final SaasPlanRepository saasPlanRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final OnboardingPinRepository onboardingPinRepository;
    private final SaasCompraRepository saasCompraRepository;
    private final SaasPagoRepository saasPagoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.onboarding.activation-default:TRIAL}")
    private String activationDefault;

    @Value("${app.onboarding.trial-days:14}")
    private int trialDays;

    @Value("${app.onboarding.generate-pin-on-pending-payment:true}")
    private boolean generatePinOnPendingPayment;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional(readOnly = true)
    public List<PublicPlanResponse> listPublicPlans() {
        return saasPlanRepository.findAllByActivoIsTrueOrderByOrdenAsc().stream().map(this::toPublic).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public OnboardingRegisterResponse register(OnboardingRegisterRequest req) {
        OnboardingActivationPolicy policy = parsePolicy(activationDefault);
        SuperAdminOnboardingDto admin = req.superAdmin();
        if (!admin.password().equals(admin.confirmPassword())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden");
        }

        String ident = normalizeIdentificacion(req.empresa().identificacion());
        if (empresaRepository.findByIdentificacion(ident).isPresent()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe una empresa con esa identificación");
        }

        String emailAdmin = admin.email().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByEmailIgnoreCase(emailAdmin)) {
            throw new BusinessException(HttpStatus.CONFLICT, "El correo del administrador ya está registrado");
        }

        SaasPlan plan = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(req.planCodigo().trim())
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no válido o inactivo"));

        Rol superRol = rolRepository
                .findByCodigo(SecurityRoles.SUPER_ADMIN)
                .orElseThrow(() -> new IllegalStateException("Rol SUPER_ADMIN no existe en catálogo"));

        Empresa empresa = buildEmpresa(req.empresa(), ident, policy);
        empresa = empresaRepository.save(empresa);

        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        usuario.setEmail(emailAdmin);
        usuario.setPasswordHash(passwordEncoder.encode(admin.password()));
        usuario.setNombre(admin.nombre().trim());
        usuario.setApellido(admin.apellido().trim());
        usuario.setRol(superRol);
        usuario.setCreatedAt(Instant.now());

        Instant now = Instant.now();
        EstadoSuscripcion subEstado;
        EstadoEmpresa empresaEstado;
        boolean userActive;
        Instant fechaFin = null;
        String outcome;
        String nextStep;
        String pin = null;

        switch (policy) {
            case TRIAL:
                empresaEstado = EstadoEmpresa.EN_PRUEBA;
                subEstado = EstadoSuscripcion.TRIAL;
                userActive = true;
                fechaFin = now.plus(trialDays, ChronoUnit.DAYS);
                outcome = "TRIAL_STARTED";
                nextStep = "LOGIN";
                break;
            case PENDING_PAYMENT:
                empresaEstado = EstadoEmpresa.COMERCIAL_PENDIENTE;
                subEstado = EstadoSuscripcion.PENDIENTE_PAGO;
                userActive = false;
                outcome = "AWAITING_PAYMENT";
                nextStep = "PAYMENT";
                break;
            case ACTIVE:
                empresaEstado = EstadoEmpresa.ACTIVA;
                subEstado = EstadoSuscripcion.ACTIVA;
                userActive = true;
                outcome = "ACCOUNT_ACTIVE";
                nextStep = "LOGIN";
                break;
            default:
                throw new IllegalStateException("Política de activación no contemplada: " + policy);
        }

        usuario.setActivo(userActive);
        usuario = usuarioRepository.save(usuario);

        Suscripcion suscripcion = Suscripcion.builder()
                .empresa(empresa)
                .plan(plan)
                .estado(subEstado)
                .fechaInicio(now)
                .fechaFin(fechaFin)
                .createdAt(now)
                .build();
        suscripcion = suscripcionRepository.save(suscripcion);

        Long compraId = null;
        Long pagoId = null;
        if (policy == OnboardingActivationPolicy.PENDING_PAYMENT) {
            SaasCompra compra = SaasCompra.builder()
                    .empresa(empresa)
                    .suscripcion(suscripcion)
                    .estado(EstadoCompra.PENDIENTE_PAGO)
                    .monto(plan.getPrecioMensual() != null ? plan.getPrecioMensual() : BigDecimal.ZERO)
                    .moneda(plan.getMoneda() != null ? plan.getMoneda() : "USD")
                    .createdAt(now)
                    .build();
            compra = saasCompraRepository.save(compra);
            SaasPago pago = SaasPago.builder()
                    .compra(compra)
                    .estado(EstadoPago.PENDIENTE)
                    .proveedor("ONBOARDING")
                    .createdAt(now)
                    .build();
            pago = saasPagoRepository.save(pago);
            compraId = compra.getId();
            pagoId = pago.getId();

            if (generatePinOnPendingPayment) {
                pin = createUniquePin();
                onboardingPinRepository.save(OnboardingPin.builder()
                        .pin(pin)
                        .empresa(empresa)
                        .suscripcion(suscripcion)
                        .createdAt(now)
                        .build());
            }
        }

        String message = switch (policy) {
            case TRIAL -> "Cuenta creada en periodo de prueba. Ya puedes iniciar sesión.";
            case ACTIVE -> "Cuenta activa. Ya puedes iniciar sesión.";
            case PENDING_PAYMENT -> "Registro recibido. Completa el pago o espera la activación para poder ingresar.";
        };

        return new OnboardingRegisterResponse(
                empresa.getId(),
                empresa.getNombre(),
                usuario.getId(),
                usuario.getEmail(),
                plan.getCodigo(),
                plan.getNombre(),
                subEstado.name(),
                empresaEstado.name(),
                outcome,
                pin,
                nextStep,
                message,
                compraId,
                pagoId);
    }

    private static OnboardingActivationPolicy parsePolicy(String raw) {
        if (raw == null || raw.isBlank()) {
            return OnboardingActivationPolicy.TRIAL;
        }
        try {
            return OnboardingActivationPolicy.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return OnboardingActivationPolicy.TRIAL;
        }
    }

    private Empresa buildEmpresa(EmpresaOnboardingDto dto, String identificacion, OnboardingActivationPolicy policy) {
        EstadoEmpresa initial = switch (policy) {
            case TRIAL -> EstadoEmpresa.EN_PRUEBA;
            case PENDING_PAYMENT -> EstadoEmpresa.COMERCIAL_PENDIENTE;
            case ACTIVE -> EstadoEmpresa.ACTIVA;
        };
        return Empresa.builder()
                .nombre(dto.nombre().trim())
                .identificacion(identificacion)
                .emailContacto(dto.emailContacto().trim().toLowerCase(Locale.ROOT))
                .telefono(blankToNull(dto.telefono()))
                .sector(blankToNull(dto.sector()))
                .pais(blankToNull(dto.pais()))
                .ciudad(blankToNull(dto.ciudad()))
                .estado(initial)
                .createdAt(Instant.now())
                .build();
    }

    private static String blankToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    private static String normalizeIdentificacion(String ident) {
        return ident.trim().toUpperCase(Locale.ROOT);
    }

    private PublicPlanResponse toPublic(SaasPlan p) {
        List<String> feats = List.of();
        if (p.getFeatures() != null && !p.getFeatures().isBlank()) {
            feats = Arrays.stream(p.getFeatures().split("\\|"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
        return new PublicPlanResponse(
                p.getCodigo(),
                p.getNombre(),
                p.getDescripcion(),
                p.getPrecioMensual(),
                p.getMoneda(),
                p.getMaxBodegas(),
                p.getMaxUsuarios(),
                feats);
    }

    private String createUniquePin() {
        for (int attempt = 0; attempt < 12; attempt++) {
            String candidate = randomPin(10);
            if (!onboardingPinRepository.existsByPin(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("No se pudo generar PIN único");
    }

    private String randomPin(int len) {
        StringBuilder sb = new StringBuilder(len);
        for (int i = 0; i < len; i++) {
            sb.append(PIN_ALPHABET.charAt(secureRandom.nextInt(PIN_ALPHABET.length())));
        }
        return sb.toString();
    }
}

package com.inventario.service.billing;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.web.dto.billing.BillingDtos.PaymentConfirmationResponse;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingPaymentConfirmationService {

    public static final String CHANNEL_MANUAL = "MANUAL_API";
    public static final String CHANNEL_WEBHOOK = "WEBHOOK";

    private final SaasPagoRepository saasPagoRepository;
    private final SaasCompraRepository saasCompraRepository;
    private final SuscripcionRepository suscripcionRepository;
    private final EmpresaRepository empresaRepository;
    private final UsuarioRepository usuarioRepository;
    private final BillingEventRepository billingEventRepository;

    @Value("${app.billing.api-secret:}")
    private String configuredSecret;

    @Value("${app.billing.post-payment-empresa-estado:ACTIVA}")
    private String postPaymentEmpresaEstado;

    public void requireValidSecret(String provided) {
        if (!secretMatches(configuredSecret, provided)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Credencial de facturación inválida");
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public PaymentConfirmationResponse confirmOnboardingPayment(Long pagoId, String channel, String payloadAudit) {
        SaasPago pago = saasPagoRepository
                .findByIdForConfirmation(pagoId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pago no encontrado"));

        if (pago.getEstado() == EstadoPago.APROBADO) {
            return buildIdempotentSuccess(pago);
        }
        if (pago.getEstado() != EstadoPago.PENDIENTE) {
            throw new BusinessException(HttpStatus.CONFLICT, "El pago no está pendiente de confirmación");
        }

        SaasCompra compra = pago.getCompra();
        Empresa empresa = compra.getEmpresa();
        Suscripcion suscripcion = compra.getSuscripcion();

        if (!empresa.getId().equals(suscripcion.getEmpresa().getId())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Inconsistencia empresa/suscripción en la compra");
        }

        if (empresa.getEstado() != EstadoEmpresa.COMERCIAL_PENDIENTE) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "La empresa no está en estado pendiente de activación comercial; no se puede confirmar este onboarding");
        }
        if (suscripcion.getEstado() != EstadoSuscripcion.PENDIENTE_PAGO) {
            throw new BusinessException(HttpStatus.CONFLICT, "La suscripción no está pendiente de pago");
        }
        if (compra.getEstado() != EstadoCompra.PENDIENTE_PAGO) {
            throw new BusinessException(HttpStatus.CONFLICT, "La compra no está pendiente de pago");
        }

        Instant now = Instant.now();
        pago.setEstado(EstadoPago.APROBADO);
        pago.setConfirmedAt(now);
        pago.setConfirmationChannel(channel);
        if (payloadAudit != null && !payloadAudit.isBlank()) {
            String trimmed = payloadAudit.length() > 8000 ? payloadAudit.substring(0, 8000) : payloadAudit;
            pago.setPayloadAudit(trimmed);
        }
        saasPagoRepository.save(pago);

        compra.setEstado(EstadoCompra.COMPLETADA);
        saasCompraRepository.save(compra);

        suscripcion.setEstado(EstadoSuscripcion.ACTIVA);
        suscripcion.setFechaFin(null);
        suscripcionRepository.save(suscripcion);

        EstadoEmpresa nuevoEstadoEmpresa = parsePostPaymentEmpresaEstado();
        if (!nuevoEstadoEmpresa.permiteAccesoUsuarios()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Configuración inválida: app.billing.post-payment-empresa-estado debe ser ACTIVA o EN_PRUEBA");
        }
        empresa.setEstado(nuevoEstadoEmpresa);
        empresaRepository.save(empresa);

        List<Usuario> superAdminsInactivos =
                usuarioRepository.findByEmpresa_IdAndRol_CodigoAndActivoIsFalse(empresa.getId(), SecurityRoles.SUPER_ADMIN);
        for (Usuario u : superAdminsInactivos) {
            u.setActivo(true);
            usuarioRepository.save(u);
        }

        billingEventRepository.save(BillingEvent.builder()
                .pago(pago)
                .tipo("PAYMENT_CONFIRMED")
                .detalle(channel + " pagoId=" + pagoId)
                .createdAt(now)
                .build());

        SaasPlan plan = suscripcion.getPlan();
        return new PaymentConfirmationResponse(
                true,
                false,
                pago.getId(),
                empresa.getId(),
                suscripcion.getEstado().name(),
                empresa.getEstado().name(),
                true,
                plan != null ? plan.getCodigo() : null,
                "Pago confirmado. El super administrador ya puede iniciar sesión.");
    }

    private PaymentConfirmationResponse buildIdempotentSuccess(SaasPago pago) {
        SaasCompra compra = pago.getCompra();
        Empresa empresa = compra.getEmpresa();
        Suscripcion suscripcion = compra.getSuscripcion();
        SaasPlan plan = suscripcion.getPlan();
        return new PaymentConfirmationResponse(
                true,
                true,
                pago.getId(),
                empresa.getId(),
                suscripcion.getEstado().name(),
                empresa.getEstado().name(),
                empresa.getEstado().permiteAccesoUsuarios(),
                plan != null ? plan.getCodigo() : null,
                "Este pago ya estaba confirmado; no se aplicaron cambios adicionales.");
    }

    private EstadoEmpresa parsePostPaymentEmpresaEstado() {
        try {
            return EstadoEmpresa.valueOf(postPaymentEmpresaEstado.trim().toUpperCase());
        } catch (Exception e) {
            return EstadoEmpresa.ACTIVA;
        }
    }

    /**
     * Comparación de secretos vía SHA-256 (digest de longitud fija, {@link MessageDigest#isEqual}).
     */
    static boolean secretMatches(String expected, String actual) {
        if (expected == null || expected.isBlank()) {
            return false;
        }
        if (actual == null) {
            actual = "";
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] ha = md.digest(expected.getBytes(StandardCharsets.UTF_8));
            byte[] hb = md.digest(actual.getBytes(StandardCharsets.UTF_8));
            return MessageDigest.isEqual(ha, hb);
        } catch (Exception e) {
            return false;
        }
    }
}

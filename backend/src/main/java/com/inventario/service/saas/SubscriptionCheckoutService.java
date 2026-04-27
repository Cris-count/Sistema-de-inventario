package com.inventario.service.saas;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.domain.repository.SaasCompraRepository;
import com.inventario.domain.repository.SaasPagoRepository;
import com.inventario.domain.repository.SaasPlanRepository;
import com.inventario.domain.repository.SuscripcionRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.billing.StripeCheckoutService;
import com.inventario.service.catalog.VentaPosStripeService;
import com.inventario.web.dto.empresa.PlanCheckoutDtos;
import com.inventario.web.error.BusinessException;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionCheckoutService {

    private static final String PROVIDER_STRIPE = "STRIPE";
    private static final String CHANNEL_STRIPE_SUCCESS = "STRIPE_CHECKOUT_SUCCESS";
    private static final String CHANNEL_STRIPE_WEBHOOK = "STRIPE_WEBHOOK_CHECKOUT_COMPLETED";
    private static final String CHANNEL_STRIPE_FAILURE = "STRIPE_CHECKOUT_FAILURE";
    private static final String CHANNEL_STRIPE_CANCELLED = "STRIPE_CHECKOUT_CANCELLED";

    private final SuscripcionRepository suscripcionRepository;
    private final SaasPlanRepository saasPlanRepository;
    private final SaasCompraRepository saasCompraRepository;
    private final SaasPagoRepository saasPagoRepository;
    private final EmpresaRepository empresaRepository;
    private final StripeCheckoutService stripeCheckoutService;
    private final CurrentUserService currentUserService;
    private final VentaPosStripeService ventaPosStripeService;

    @Value("${app.billing.post-payment-empresa-estado:ACTIVA}")
    private String postPaymentEmpresaEstado;

    @Transactional(rollbackFor = Exception.class)
    public PlanCheckoutDtos.CreateCheckoutSessionResponse createCheckoutSession(Long empresaId, String targetPlanCodeRaw) {
        String targetPlanCode = normalizePlanCode(targetPlanCodeRaw);
        SaasPlan targetPlan = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(targetPlanCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no disponible o inactivo."));

        Suscripcion suscripcion = suscripcionRepository
                .findByEmpresaId(empresaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.CONFLICT,
                        "No encontramos suscripción para tu empresa. Contacta soporte."));

        String currentPlanCode = getCurrentPlan(suscripcion);
        PlanCheckoutDtos.CheckoutFlowMode mode = resolveFlowMode(currentPlanCode, targetPlanCode);
        if (!canPurchasePlan(currentPlanCode, targetPlanCode)) {
            if (currentPlanCode != null && currentPlanCode.equals(targetPlanCode)) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Ya estás en este plan.");
            }
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "El plan seleccionado no está disponible para este flujo. Solo se permiten compras iniciales o upgrades.");
        }
        if (mode == PlanCheckoutDtos.CheckoutFlowMode.UPGRADE) {
            assertUpgradeAllowed(currentPlanCode, targetPlanCode);
        }
        assertNoPendingCheckout(empresaId);

        Instant now = Instant.now();
        SaasCompra compra = SaasCompra.builder()
                .empresa(suscripcion.getEmpresa())
                .suscripcion(suscripcion)
                .tipo(mode == PlanCheckoutDtos.CheckoutFlowMode.PURCHASE ? SaasCompraTipo.ONBOARDING : SaasCompraTipo.CAMBIO_PLAN)
                .planDestino(targetPlan)
                .estado(EstadoCompra.PENDIENTE_PAGO)
                .monto(targetPlan.getPrecioMensual() != null ? targetPlan.getPrecioMensual() : BigDecimal.ZERO)
                .moneda(targetPlan.getMoneda() != null ? targetPlan.getMoneda() : "COP")
                .createdAt(now)
                .build();
        compra = saasCompraRepository.save(compra);

        if (!stripeCheckoutService.isEnabled()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe no está configurado. Define STRIPE_SECRET_KEY en el entorno del servidor.");
        }

        SaasPago pago = SaasPago.builder()
                .compra(compra)
                .estado(EstadoPago.PENDIENTE)
                .proveedor(PROVIDER_STRIPE)
                .idExterno("stripe:pending")
                .payloadAudit("Creando sesión Stripe Checkout")
                .createdAt(now)
                .build();
        pago = saasPagoRepository.save(pago);

        Long userId = currentUserService.requireUsuario().getId();
        StripeCheckoutService.StripeSessionResult stripeSession = stripeCheckoutService.createCheckoutSession(
                compra,
                pago,
                userId,
                empresaId,
                currentPlanCode,
                targetPlanCode,
                mode);
        pago.setIdExterno(stripeSession.sessionId());
        pago.setPayloadAudit("Stripe checkout creado");
        saasPagoRepository.save(pago);
        String message = mode == PlanCheckoutDtos.CheckoutFlowMode.PURCHASE
                ? "Checkout de Stripe creado para compra inicial. Te redirigimos para completar el pago."
                : "Checkout de Stripe creado para mejora de plan. Te redirigimos para completar el pago.";
        return new PlanCheckoutDtos.CreateCheckoutSessionResponse(
                stripeSession.sessionId(),
                compra.getId(),
                pago.getId(),
                currentPlanCode,
                targetPlanCode,
                mode,
                PlanCheckoutDtos.CheckoutProvider.STRIPE,
                true,
                stripeSession.checkoutUrl(),
                message);
    }

    @Transactional(rollbackFor = Exception.class)
    public PlanCheckoutDtos.ResolveCheckoutSessionResponse resolveCheckoutSession(
            Long empresaId, Long pagoId, PlanCheckoutDtos.CheckoutResolution resolution, String stripeSessionId) {
        SaasPago pago = saasPagoRepository
                .findByIdForConfirmation(pagoId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Pago no encontrado."));
        SaasCompra compra = pago.getCompra();
        if (!compra.getEmpresa().getId().equals(empresaId)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Este pago no pertenece a tu empresa.");
        }

        String currentPlanCode = getCurrentPlan(compra.getSuscripcion());
        String targetPlanCode = compra.getPlanDestino() != null ? normalizePlanCode(compra.getPlanDestino().getCodigo()) : currentPlanCode;
        PlanCheckoutDtos.CheckoutFlowMode mode = resolveFlowMode(currentPlanCode, targetPlanCode);

        if (pago.getEstado() == EstadoPago.APROBADO) {
            return new PlanCheckoutDtos.ResolveCheckoutSessionResponse(
                    true,
                    pago.getId(),
                    compra.getId(),
                    getCurrentPlan(compra.getSuscripcion()),
                    targetPlanCode,
                    mode,
                    "SUCCESS",
                    "Este pago ya estaba confirmado. No aplicamos cambios adicionales.");
        }
        if (pago.getEstado() != EstadoPago.PENDIENTE || compra.getEstado() != EstadoCompra.PENDIENTE_PAGO) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "La sesión de checkout no está pendiente y no puede resolverse nuevamente.");
        }

        return switch (resolution) {
            case SUCCESS -> {
                if (stripeSessionId == null || stripeSessionId.isBlank()) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST, "Falta session_id de Stripe para confirmar el pago.");
                }
                if (!isStripeProvider(pago)) {
                    throw new BusinessException(HttpStatus.CONFLICT, "Este pago no está asociado a Stripe.");
                }
                if (!stripeSessionId.equals(pago.getIdExterno())) {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "La sesión de Stripe no coincide con el pago pendiente.");
                }
                boolean paid = stripeCheckoutService.isCheckoutPaid(stripeSessionId, pago.getId(), targetPlanCode);
                if (!paid) {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "Stripe aún no reporta este checkout como pagado.");
                }
                yield handlePaymentSuccess(
                        pago,
                        compra,
                        mode,
                        targetPlanCode,
                        CHANNEL_STRIPE_SUCCESS,
                        "Pago confirmado por verificación directa con Stripe (sesión "
                                + stripeSessionId
                                + ").");
            }
            case FAILURE -> handlePaymentFailure(
                    pago, compra, mode, targetPlanCode, CHANNEL_STRIPE_FAILURE, "Pago no completado.");
            case CANCELLED -> handlePaymentFailure(
                    pago, compra, mode, targetPlanCode, CHANNEL_STRIPE_CANCELLED, "Checkout cancelado antes de pagar.");
        };
    }

    /**
     * Aplica el alta del plan tras {@code checkout.session.completed}. La firma del webhook ya fue validada en el
     * controlador. Idempotente: reenvíos de Stripe no duplican el cambio.
     */
    @Transactional(rollbackFor = Exception.class)
    public void applyCheckoutSessionCompletedFromWebhook(Session session, String stripeEventId) {
        if (session == null) {
            log.warn("Stripe webhook: sesión nula");
            return;
        }
        String sessionId = session.getId();
        String paymentStatus = session.getPaymentStatus();
        if (paymentStatus == null || !"paid".equalsIgnoreCase(paymentStatus.trim())) {
            log.info("Stripe webhook: sesión {} payment_status={} — sin aplicar cambios", sessionId, paymentStatus);
            return;
        }
        Map<String, String> md = session.getMetadata();
        if (md == null || md.isEmpty()) {
            log.warn("Stripe webhook: sesión {} sin metadata", sessionId);
            return;
        }
        if (StripeCheckoutService.FLOW_POS_VENTA.equals(md.get("flowType"))) {
            ventaPosStripeService.applyCheckoutSessionCompletedFromWebhook(session, stripeEventId);
            return;
        }
        String pagoIdRaw = md.get("pagoId");
        String companyIdRaw = md.get("companyId");
        String metaTargetRaw = md.get("targetPlan");
        String metaSuscripcionRaw = md.get("suscripcionId");
        if (pagoIdRaw == null || companyIdRaw == null || metaTargetRaw == null) {
            log.warn("Stripe webhook: metadata incompleta (pagoId/companyId/targetPlan) sesión={}", sessionId);
            return;
        }
        final long pagoId;
        final long companyId;
        try {
            pagoId = Long.parseLong(pagoIdRaw.trim());
            companyId = Long.parseLong(companyIdRaw.trim());
        } catch (NumberFormatException e) {
            log.warn("Stripe webhook: metadata numérica inválida sesión={}", sessionId);
            return;
        }
        String metaTarget = normalizePlanCode(metaTargetRaw);
        if (metaTarget.isBlank()) {
            log.warn("Stripe webhook: targetPlan vacío sesión={}", sessionId);
            return;
        }

        SaasPago pago = saasPagoRepository.findByIdForConfirmation(pagoId).orElse(null);
        if (pago == null) {
            log.warn("Stripe webhook: pago {} no encontrado", pagoId);
            return;
        }
        if (pago.getEstado() == EstadoPago.APROBADO) {
            log.info("Stripe webhook: idempotente pagoId={} eventId={} (ya aprobado)", pagoId, stripeEventId);
            return;
        }
        if (pago.getEstado() != EstadoPago.PENDIENTE) {
            log.warn("Stripe webhook: pago {} en estado {} — no se aplica", pagoId, pago.getEstado());
            return;
        }

        SaasCompra compra = pago.getCompra();
        if (!compra.getEmpresa().getId().equals(companyId)) {
            log.warn("Stripe webhook: empresa no coincide para pago {}", pagoId);
            return;
        }
        if (compra.getEstado() != EstadoCompra.PENDIENTE_PAGO) {
            log.warn("Stripe webhook: compra {} estado {} — no se aplica", compra.getId(), compra.getEstado());
            return;
        }
        if (!sessionId.equals(pago.getIdExterno())) {
            log.warn("Stripe webhook: id de sesión no coincide con pago {} (externo={})", pagoId, pago.getIdExterno());
            return;
        }

        Suscripcion suscripcion = compra.getSuscripcion();
        if (metaSuscripcionRaw != null && !metaSuscripcionRaw.isBlank()) {
            try {
                long sid = Long.parseLong(metaSuscripcionRaw.trim());
                if (!suscripcion.getId().equals(sid)) {
                    log.warn("Stripe webhook: suscripcionId metadata no coincide pago={}", pagoId);
                    return;
                }
            } catch (NumberFormatException e) {
                log.warn("Stripe webhook: suscripcionId inválido pago={}", pagoId);
                return;
            }
        }

        SaasPlan planDestino = compra.getPlanDestino();
        if (planDestino == null || planDestino.getCodigo() == null) {
            log.warn("Stripe webhook: compra {} sin plan destino", compra.getId());
            return;
        }
        String destCodigo = normalizePlanCode(planDestino.getCodigo());
        if (!metaTarget.equals(destCodigo)) {
            log.warn(
                    "Stripe webhook: targetPlan metadata {} ≠ plan destino compra {} pago {}",
                    metaTarget,
                    destCodigo,
                    pagoId);
            return;
        }

        String dbCurrentPlan = getCurrentPlan(suscripcion);
        if (!canPurchasePlan(dbCurrentPlan, metaTarget)) {
            log.warn(
                    "Stripe webhook: transición no permitida empresa={} actual={} target={}",
                    companyId,
                    dbCurrentPlan,
                    metaTarget);
            return;
        }
        PlanCheckoutDtos.CheckoutFlowMode mode = resolveFlowMode(dbCurrentPlan, metaTarget);
        if (mode == PlanCheckoutDtos.CheckoutFlowMode.UPGRADE) {
            assertUpgradeAllowed(dbCurrentPlan, metaTarget);
        }

        if (!stripeCheckoutService.isCheckoutPaid(sessionId, pagoId, metaTarget)) {
            log.info(
                    "Stripe webhook: API Stripe aún no marca pagada la sesión {} — se reintentará si Stripe reenvía",
                    sessionId);
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Sesión de checkout aún no verificable como pagada ante la API de Stripe.");
        }

        String audit = "Webhook Stripe event=" + stripeEventId + " session=" + sessionId;
        handlePaymentSuccess(pago, compra, mode, metaTarget, CHANNEL_STRIPE_WEBHOOK, audit);
        log.info("Stripe webhook: plan aplicado empresa={} pago={} target={} event={}", companyId, pagoId, metaTarget, stripeEventId);
    }

    private PlanCheckoutDtos.ResolveCheckoutSessionResponse handlePaymentSuccess(
            SaasPago pago,
            SaasCompra compra,
            PlanCheckoutDtos.CheckoutFlowMode mode,
            String targetPlanCode,
            String successChannel,
            String auditMessage) {
        Instant now = Instant.now();
        Suscripcion suscripcion = compra.getSuscripcion();
        SaasPlan targetPlan = compra.getPlanDestino();
        if (targetPlan == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "No se encontró plan destino en la compra.");
        }

        pago.setEstado(EstadoPago.APROBADO);
        pago.setConfirmedAt(now);
        pago.setConfirmationChannel(successChannel);
        pago.setPayloadAudit(auditMessage);
        saasPagoRepository.save(pago);

        compra.setEstado(EstadoCompra.COMPLETADA);
        saasCompraRepository.save(compra);

        suscripcion.setPlan(targetPlan);
        if (suscripcion.getEstado() != EstadoSuscripcion.CANCELADA
                && suscripcion.getEstado() != EstadoSuscripcion.EXPIRADA) {
            suscripcion.setEstado(EstadoSuscripcion.ACTIVA);
            suscripcion.setFechaFin(null);
        }
        suscripcionRepository.save(suscripcion);

        Empresa empresa = compra.getEmpresa();
        if (empresa.getEstado() == EstadoEmpresa.EN_PRUEBA
                || empresa.getEstado() == EstadoEmpresa.COMERCIAL_PENDIENTE) {
            EstadoEmpresa nuevoEstado = parsePostPaymentEmpresaEstado();
            if (!nuevoEstado.permiteAccesoUsuarios()) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST,
                        "Configuración inválida: app.billing.post-payment-empresa-estado debe ser ACTIVA o EN_PRUEBA");
            }
            empresa.setEstado(nuevoEstado);
            empresaRepository.save(empresa);
        }

        String message = mode == PlanCheckoutDtos.CheckoutFlowMode.PURCHASE
                ? "Pago confirmado. El plan quedó activado para tu empresa."
                : "Pago confirmado. Tu mejora de plan ya está activa.";
        return new PlanCheckoutDtos.ResolveCheckoutSessionResponse(
                true,
                pago.getId(),
                compra.getId(),
                getCurrentPlan(suscripcion),
                targetPlanCode,
                mode,
                "SUCCESS",
                message);
    }

    private PlanCheckoutDtos.ResolveCheckoutSessionResponse handlePaymentFailure(
            SaasPago pago,
            SaasCompra compra,
            PlanCheckoutDtos.CheckoutFlowMode mode,
            String targetPlanCode,
            String channel,
            String message) {
        String currentPlanCode = getCurrentPlan(compra.getSuscripcion());
        pago.setEstado(EstadoPago.RECHAZADO);
        pago.setConfirmationChannel(channel);
        pago.setPayloadAudit(message);
        saasPagoRepository.save(pago);

        compra.setEstado(EstadoCompra.CANCELADA);
        saasCompraRepository.save(compra);

        return new PlanCheckoutDtos.ResolveCheckoutSessionResponse(
                false,
                pago.getId(),
                compra.getId(),
                currentPlanCode,
                targetPlanCode,
                mode,
                channel.equals(CHANNEL_STRIPE_CANCELLED) ? "CANCELLED" : "FAILURE",
                message);
    }

    private void assertNoPendingCheckout(Long empresaId) {
        saasCompraRepository
                .findFirstByEmpresa_IdAndEstadoOrderByIdDesc(empresaId, EstadoCompra.PENDIENTE_PAGO)
                .ifPresent(c -> {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "Ya tienes un checkout pendiente. Resuélvelo antes de iniciar otro.");
                });
    }

    private static String getCurrentPlan(Suscripcion suscripcion) {
        if (suscripcion == null || suscripcion.getPlan() == null || suscripcion.getPlan().getCodigo() == null) {
            return null;
        }
        return normalizePlanCode(suscripcion.getPlan().getCodigo());
    }

    private static boolean isStripeProvider(SaasPago pago) {
        if (pago == null || pago.getProveedor() == null) return false;
        return PROVIDER_STRIPE.equalsIgnoreCase(pago.getProveedor().trim());
    }

    private static PlanCheckoutDtos.CheckoutFlowMode resolveFlowMode(String currentPlanCode, String targetPlanCode) {
        if (currentPlanCode == null || currentPlanCode.isBlank()) {
            return PlanCheckoutDtos.CheckoutFlowMode.PURCHASE;
        }
        if (isUpgrade(currentPlanCode, targetPlanCode)) {
            return PlanCheckoutDtos.CheckoutFlowMode.UPGRADE;
        }
        return PlanCheckoutDtos.CheckoutFlowMode.PURCHASE;
    }

    private static boolean isUpgrade(String currentPlanCode, String targetPlanCode) {
        return PlanTierOrder.isUpgrade(currentPlanCode, targetPlanCode);
    }

    private static boolean canPurchasePlan(String currentPlanCode, String targetPlanCode) {
        if (currentPlanCode == null || currentPlanCode.isBlank()) {
            return PlanTierOrder.tier(targetPlanCode) > 0;
        }
        return isUpgrade(currentPlanCode, targetPlanCode);
    }

    private static void assertUpgradeAllowed(String currentPlanCode, String targetPlanCode) {
        if (!isUpgrade(currentPlanCode, targetPlanCode)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Solo puedes seleccionar planes superiores al actual en esta pantalla.");
        }
    }

    private static String normalizePlanCode(String code) {
        if (code == null || code.isBlank()) {
            return "";
        }
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private EstadoEmpresa parsePostPaymentEmpresaEstado() {
        try {
            return EstadoEmpresa.valueOf(postPaymentEmpresaEstado.trim().toUpperCase());
        } catch (Exception e) {
            return EstadoEmpresa.ACTIVA;
        }
    }
}

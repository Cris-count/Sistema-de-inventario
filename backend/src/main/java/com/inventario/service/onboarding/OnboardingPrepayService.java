package com.inventario.service.onboarding;

import com.inventario.domain.entity.OnboardingPrepaidCheckout;
import com.inventario.domain.entity.SaasPlan;
import com.inventario.domain.repository.OnboardingPrepaidCheckoutRepository;
import com.inventario.domain.repository.SaasPlanRepository;
import com.inventario.service.billing.StripeCheckoutService;
import com.inventario.web.dto.onboarding.OnboardingDtos;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
@Service
@RequiredArgsConstructor
public class OnboardingPrepayService {

    private final StripeCheckoutService stripeCheckoutService;
    private final SaasPlanRepository saasPlanRepository;
    private final OnboardingPrepaidCheckoutRepository onboardingPrepaidCheckoutRepository;

    @Value("${app.onboarding.require-stripe-prepay:true}")
    private boolean requireStripePrepay;

    public boolean isPrepayRequiredForPlan(SaasPlan plan) {
        if (!requireStripePrepay || !stripeCheckoutService.isEnabled()) {
            return false;
        }
        BigDecimal precio = plan.getPrecioMensual() != null ? plan.getPrecioMensual() : BigDecimal.ZERO;
        return precio.compareTo(BigDecimal.ZERO) > 0;
    }

    @Transactional(rollbackFor = Exception.class)
    public OnboardingDtos.CreatePrepayCheckoutResponse createPrepayCheckout(String planCodigoRaw) {
        SaasPlan plan = resolvePlan(planCodigoRaw);
        if (!isPrepayRequiredForPlan(plan)) {
            return new OnboardingDtos.CreatePrepayCheckoutResponse(
                    null, null, false, "Continúa al siguiente paso sin pago en línea.");
        }
        if (!stripeCheckoutService.isEnabled()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe no está configurado. Define STRIPE_SECRET_KEY o desactiva app.onboarding.require-stripe-prepay.");
        }
        BigDecimal monto = plan.getPrecioMensual() != null ? plan.getPrecioMensual() : BigDecimal.ZERO;
        String moneda = plan.getMoneda() != null ? plan.getMoneda() : "COP";
        String code = plan.getCodigo().trim();
        StripeCheckoutService.StripeSessionResult session =
                stripeCheckoutService.createOnboardingPrepaySession(code, monto, moneda);
        return new OnboardingDtos.CreatePrepayCheckoutResponse(
                session.checkoutUrl(),
                session.sessionId(),
                true,
                "Redirigiendo a Stripe para completar el pago.");
    }

    /**
     * Idempotente: si la sesión ya está registrada sin consumir, no vuelve a llamar a Stripe.
     */
    @Transactional(rollbackFor = Exception.class)
    public void confirmPrepayCheckout(String sessionIdRaw, String planCodigoRaw) {
        if (!stripeCheckoutService.isEnabled()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe no está configurado; no se puede confirmar el pago.");
        }
        String sessionId = sessionIdRaw == null ? "" : sessionIdRaw.trim();
        if (sessionId.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Falta session_id de Stripe.");
        }
        SaasPlan plan = resolvePlan(planCodigoRaw);
        if (!isPrepayRequiredForPlan(plan)) {
            return;
        }
        String planCodigo = plan.getCodigo().trim();
        var existing = onboardingPrepaidCheckoutRepository.findByStripeSessionId(sessionId);
        if (existing.isPresent()) {
            OnboardingPrepaidCheckout row = existing.get();
            if (!row.getPlanCodigo().equalsIgnoreCase(planCodigo)) {
                throw new BusinessException(
                        HttpStatus.CONFLICT, "Esta sesión de pago corresponde a otro plan.");
            }
            if (row.getConsumedAt() != null) {
                throw new BusinessException(
                        HttpStatus.CONFLICT, "Esta sesión de pago ya fue utilizada en un registro.");
            }
            return;
        }
        if (!stripeCheckoutService.verifyOnboardingPrepayPaid(sessionId, planCodigo)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Stripe aún no reporta el pago como completado. Espera unos segundos y reintenta.");
        }
        Instant now = Instant.now();
        onboardingPrepaidCheckoutRepository.save(OnboardingPrepaidCheckout.builder()
                .stripeSessionId(sessionId)
                .planCodigo(planCodigo)
                .paidAt(now)
                .consumedAt(null)
                .createdAt(now)
                .build());
    }

    /**
     * Valida fila prepago + Stripe antes de crear empresa. {@code null} si no aplica prepago para el plan.
     */
    @Transactional(readOnly = true)
    public OnboardingPrepaidCheckout assertReadyForRegister(String stripeSessionIdRaw, SaasPlan plan) {
        if (!isPrepayRequiredForPlan(plan)) {
            return null;
        }
        String sid = stripeSessionIdRaw == null ? "" : stripeSessionIdRaw.trim();
        if (sid.isEmpty()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Debes completar el pago del plan antes de finalizar el registro.");
        }
        OnboardingPrepaidCheckout row = onboardingPrepaidCheckoutRepository
                .findByStripeSessionIdAndConsumedAtIsNull(sid)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.BAD_REQUEST,
                        "No hay pago verificado para esta sesión. Vuelve al paso 1 y completa el checkout en Stripe."));
        if (!row.getPlanCodigo().equalsIgnoreCase(plan.getCodigo().trim())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El pago corresponde a otro plan.");
        }
        if (!stripeCheckoutService.verifyOnboardingPrepayPaid(sid, plan.getCodigo().trim())) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Stripe aún no confirma el pago. Espera unos segundos y vuelve a enviar el registro.");
        }
        return row;
    }

    @Transactional(rollbackFor = Exception.class)
    public void markConsumed(OnboardingPrepaidCheckout row) {
        if (row == null) {
            return;
        }
        row.setConsumedAt(Instant.now());
        onboardingPrepaidCheckoutRepository.save(row);
    }

    private SaasPlan resolvePlan(String planCodigoRaw) {
        if (planCodigoRaw == null || planCodigoRaw.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Plan no indicado.");
        }
        String code = planCodigoRaw.trim();
        return saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(code)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no disponible o inactivo."));
    }
}

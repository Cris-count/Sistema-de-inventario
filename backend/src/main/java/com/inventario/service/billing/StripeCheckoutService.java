package com.inventario.service.billing;

import com.inventario.domain.entity.SaasCompra;
import com.inventario.domain.entity.SaasPago;
import com.inventario.web.dto.empresa.PlanCheckoutDtos;
import com.inventario.web.error.BusinessException;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class StripeCheckoutService {

    @Value("${app.billing.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.billing.stripe.frontend-base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    public record StripeSessionResult(String sessionId, String checkoutUrl) {}

    private static final String FLOW_ONBOARDING_PREPAY = "ONBOARDING_PREPAY";

    public boolean isEnabled() {
        return stripeSecretKey != null && !stripeSecretKey.isBlank();
    }

    public StripeSessionResult createCheckoutSession(
            SaasCompra compra,
            SaasPago pago,
            Long userId,
            Long companyId,
            String currentPlanCode,
            String targetPlanCode,
            PlanCheckoutDtos.CheckoutFlowMode mode) {
        ensureConfigured();
        try {
            Stripe.apiKey = stripeSecretKey;
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(buildSuccessUrl(pago.getId()))
                    .setCancelUrl(buildCancelUrl(pago.getId()))
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency(normalizeCurrency(compra.getMoneda()))
                                            .setUnitAmount(toStripeAmount(compra.getMonto()))
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName("Plan " + targetPlanCode)
                                                            .build())
                                            .build())
                            .build())
                    .putMetadata("userId", String.valueOf(userId))
                    .putMetadata("companyId", String.valueOf(companyId))
                    .putMetadata("suscripcionId", String.valueOf(compra.getSuscripcion().getId()))
                    .putMetadata("compraId", String.valueOf(compra.getId()))
                    .putMetadata("pagoId", String.valueOf(pago.getId()))
                    .putMetadata("currentPlan", currentPlanCode == null ? "" : currentPlanCode)
                    .putMetadata("targetPlan", targetPlanCode)
                    .putMetadata("flowType", mode.name())
                    .build();
            Session session = Session.create(params);
            return new StripeSessionResult(session.getId(), session.getUrl());
        } catch (StripeException ex) {
            throw new BusinessException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo crear la sesión de pago en Stripe. Intenta de nuevo.");
        }
    }

    /**
     * Checkout de pago único antes del registro (sin empresa aún). Success/cancel vuelven a {@code /registro}.
     */
    public StripeSessionResult createOnboardingPrepaySession(
            String targetPlanCode, BigDecimal monto, String moneda) {
        ensureConfigured();
        try {
            Stripe.apiKey = stripeSecretKey;
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendBaseUrl + "/registro?stripePrepay=1&session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendBaseUrl + "/registro?stripePrepay=0")
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setQuantity(1L)
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency(normalizeCurrency(moneda))
                                            .setUnitAmount(toStripeAmount(monto))
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName("Plan " + targetPlanCode + " — alta Cersik")
                                                            .build())
                                            .build())
                            .build())
                    .putMetadata("targetPlan", targetPlanCode)
                    .putMetadata("flowType", FLOW_ONBOARDING_PREPAY)
                    .build();
            Session session = Session.create(params);
            return new StripeSessionResult(session.getId(), session.getUrl());
        } catch (StripeException ex) {
            throw new BusinessException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo crear la sesión de pago en Stripe. Intenta de nuevo.");
        }
    }

    public boolean isCheckoutPaid(String sessionId, Long expectedPagoId, String expectedTargetPlan) {
        ensureConfigured();
        try {
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.retrieve(sessionId);
            if (session == null) {
                return false;
            }
            Map<String, String> md = session.getMetadata() != null ? session.getMetadata() : new HashMap<>();
            if (!String.valueOf(expectedPagoId).equals(md.get("pagoId"))) {
                return false;
            }
            if (expectedTargetPlan != null && !expectedTargetPlan.equalsIgnoreCase(md.get("targetPlan"))) {
                return false;
            }
            String paymentStatus = session.getPaymentStatus();
            String status = session.getStatus();
            return "paid".equalsIgnoreCase(paymentStatus) && "complete".equalsIgnoreCase(status);
        } catch (StripeException ex) {
            throw new BusinessException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo verificar el pago con Stripe.");
        }
    }

    /** Verifica sesión de prepago onboarding (sin pagoId en metadata). */
    public boolean verifyOnboardingPrepayPaid(String sessionId, String expectedTargetPlan) {
        ensureConfigured();
        try {
            Stripe.apiKey = stripeSecretKey;
            Session session = Session.retrieve(sessionId);
            if (session == null) {
                return false;
            }
            Map<String, String> md = session.getMetadata() != null ? session.getMetadata() : new HashMap<>();
            if (!FLOW_ONBOARDING_PREPAY.equals(md.get("flowType"))) {
                return false;
            }
            if (expectedTargetPlan != null
                    && !expectedTargetPlan.equalsIgnoreCase(md.get("targetPlan"))) {
                return false;
            }
            String paymentStatus = session.getPaymentStatus();
            String status = session.getStatus();
            return "paid".equalsIgnoreCase(paymentStatus) && "complete".equalsIgnoreCase(status);
        } catch (StripeException ex) {
            throw new BusinessException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo verificar el pago con Stripe.");
        }
    }

    private void ensureConfigured() {
        if (!isEnabled()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe no está configurado. Define STRIPE_SECRET_KEY en el entorno del servidor.");
        }
    }

    private String buildSuccessUrl(Long pagoId) {
        return frontendBaseUrl + "/app/mi-empresa?stripeCheckout=success&pagoId=" + pagoId + "&session_id={CHECKOUT_SESSION_ID}";
    }

    private String buildCancelUrl(Long pagoId) {
        return frontendBaseUrl + "/app/mi-empresa?stripeCheckout=cancel&pagoId=" + pagoId;
    }

    private static String normalizeCurrency(String raw) {
        if (raw == null || raw.isBlank()) return "cop";
        return raw.trim().toLowerCase();
    }

    private static long toStripeAmount(BigDecimal amount) {
        BigDecimal safe = amount != null ? amount : BigDecimal.ZERO;
        return safe.movePointRight(2).longValue();
    }
}

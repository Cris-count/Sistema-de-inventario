package com.inventario.web.controller;

import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.saas.SubscriptionCheckoutService;
import com.inventario.web.error.BusinessException;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/billing/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final SubscriptionCheckoutService subscriptionCheckoutService;
    private final ApplicationRateLimitService applicationRateLimitService;

    @Value("${app.billing.stripe.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String stripeSignature,
            HttpServletRequest request) {
        applicationRateLimitService.assertBillingPostAllowed(request);
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Webhook Stripe ignorado: STRIPE_WEBHOOK_SECRET vacío");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
        if (stripeSignature == null || stripeSignature.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        final Event event;
        try {
            event = Webhook.constructEvent(payload, stripeSignature, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Webhook Stripe: firma inválida");
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.warn("Webhook Stripe: payload inválido ({})", e.getMessage());
            return ResponseEntity.badRequest().build();
        }

        if (!"checkout.session.completed".equals(event.getType())) {
            return ResponseEntity.ok().build();
        }

        StripeObject obj = event.getDataObjectDeserializer().getObject().orElse(null);
        if (!(obj instanceof Session session)) {
            log.warn("Webhook Stripe: no se pudo leer Session del evento {}", event.getId());
            return ResponseEntity.ok().build();
        }

        try {
            subscriptionCheckoutService.applyCheckoutSessionCompletedFromWebhook(session, event.getId());
        } catch (BusinessException ex) {
            if (ex.getStatus() == HttpStatus.CONFLICT || ex.getStatus() == HttpStatus.BAD_GATEWAY) {
                log.info(
                        "Webhook Stripe: reintento posible eventId={} — {}",
                        event.getId(),
                        ex.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
            log.info("Webhook Stripe: eventId={} — {}", event.getId(), ex.getMessage());
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            log.warn("Webhook Stripe: error inesperado eventId={} — {}", event.getId(), ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok().build();
    }
}

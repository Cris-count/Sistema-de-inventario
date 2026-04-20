package com.inventario.web.controller;

import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.billing.BillingPaymentConfirmationService;
import com.inventario.web.dto.billing.BillingDtos.BillingWebhookRequest;
import com.inventario.web.dto.billing.BillingDtos.PaymentConfirmationResponse;
import com.inventario.web.error.BusinessException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingPaymentConfirmationService billingPaymentConfirmationService;
    private final ApplicationRateLimitService applicationRateLimitService;

    @PostMapping("/webhook")
    @SecurityRequirements
    @Operation(summary = "Webhook de confirmación de pago", description = "Diseñado para integración con pasarela; requiere X-Billing-Secret.")
    public PaymentConfirmationResponse webhook(
            @Valid @RequestBody BillingWebhookRequest body,
            @RequestHeader(value = "X-Billing-Secret", required = false) String secret,
            HttpServletRequest httpRequest) {
        applicationRateLimitService.assertBillingPostAllowed(httpRequest);
        billingPaymentConfirmationService.requireValidSecret(secret);
        if (body.event() != null
                && !body.event().isBlank()
                && !"payment.completed".equalsIgnoreCase(body.event())
                && !"paid".equalsIgnoreCase(body.event())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Evento de webhook no soportado");
        }
        return billingPaymentConfirmationService.confirmOnboardingPayment(
                body.pagoId(), BillingPaymentConfirmationService.CHANNEL_WEBHOOK, null);
    }

    @PostMapping("/pagos/{pagoId}/confirmar-onboarding")
    @SecurityRequirements
    @Operation(summary = "Confirmar pago de onboarding (operación interna)", description = "Activa empresa, suscripción y super admin tras pago validado.")
    public PaymentConfirmationResponse confirmarOnboarding(
            @PathVariable Long pagoId,
            @RequestHeader(value = "X-Billing-Secret", required = false) String secret,
            HttpServletRequest httpRequest) {
        applicationRateLimitService.assertBillingPostAllowed(httpRequest);
        billingPaymentConfirmationService.requireValidSecret(secret);
        return billingPaymentConfirmationService.confirmOnboardingPayment(
                pagoId, BillingPaymentConfirmationService.CHANNEL_MANUAL, null);
    }
}

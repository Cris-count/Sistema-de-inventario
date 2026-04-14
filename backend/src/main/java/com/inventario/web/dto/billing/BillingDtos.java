package com.inventario.web.dto.billing;

import jakarta.validation.constraints.NotNull;

public final class BillingDtos {

    private BillingDtos() {}

    public record BillingWebhookRequest(
            @NotNull Long pagoId,
            /** Opcional: p. ej. payment.completed (pasarela real). */
            String event) {}

    public record PaymentConfirmationResponse(
            boolean success,
            boolean alreadyConfirmed,
            Long pagoId,
            Long empresaId,
            String suscripcionEstado,
            String empresaEstado,
            boolean userCanLogin,
            String planCodigo,
            String message) {}
}

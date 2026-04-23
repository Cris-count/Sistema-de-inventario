package com.inventario.web.dto.empresa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class PlanCheckoutDtos {

    private PlanCheckoutDtos() {}

    public enum CheckoutFlowMode {
        PURCHASE,
        UPGRADE
    }

    public enum CheckoutResolution {
        SUCCESS,
        FAILURE,
        CANCELLED
    }

    public enum CheckoutProvider {
        STRIPE
    }

    public record CreateCheckoutSessionRequest(
            @NotBlank @Size(max = 40) String planCodigo
    ) {}

    public record CreateCheckoutSessionResponse(
            String sessionId,
            Long compraId,
            Long pagoId,
            String currentPlanCodigo,
            String targetPlanCodigo,
            CheckoutFlowMode mode,
            CheckoutProvider provider,
            boolean requiresRedirect,
            String checkoutUrl,
            String message
    ) {}

    public record ResolveCheckoutSessionRequest(
            @NotNull CheckoutResolution result,
            String sessionId
    ) {}

    public record ResolveCheckoutSessionResponse(
            boolean success,
            Long pagoId,
            Long compraId,
            String currentPlanCodigo,
            String targetPlanCodigo,
            CheckoutFlowMode mode,
            String result,
            String message
    ) {}
}

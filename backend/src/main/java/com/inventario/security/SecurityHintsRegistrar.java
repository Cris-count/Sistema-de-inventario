package com.inventario.security;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.aot.hint.TypeReference;

public class SecurityHintsRegistrar implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        // JJWT Reflection Hints
        registerTypes(hints,
                "io.jsonwebtoken.impl.DefaultJwtBuilder",
                "io.jsonwebtoken.impl.DefaultJwtParserBuilder",
                "io.jsonwebtoken.impl.DefaultJwtParser",
                "io.jsonwebtoken.jackson.io.JacksonSerializer",
                "io.jsonwebtoken.jackson.io.JacksonDeserializer"
        );

        // TOTP Reflection Hints
        registerTypes(hints,
                "dev.samstevens.totp.code.DefaultCodeGenerator",
                "dev.samstevens.totp.code.DefaultCodeVerifier",
                "dev.samstevens.totp.time.SystemTimeProvider",
                "dev.samstevens.totp.code.HashingAlgorithm"
        );

        // DTOs - Inventory (MovimientoDtos)
        registerTypes(hints,
                "com.inventario.web.dto.MovimientoDtos$EntradaRequest",
                "com.inventario.web.dto.MovimientoDtos$LineaEntrada",
                "com.inventario.web.dto.MovimientoDtos$SalidaRequest",
                "com.inventario.web.dto.MovimientoDtos$LineaSalida",
                "com.inventario.web.dto.MovimientoDtos$TransferenciaRequest",
                "com.inventario.web.dto.MovimientoDtos$LineaTransferencia",
                "com.inventario.web.dto.MovimientoDtos$AjusteRequest",
                "com.inventario.web.dto.MovimientoDtos$LineaAjuste",
                "com.inventario.web.dto.MovimientoDtos$StockInicialRequest",
                "com.inventario.web.dto.MovimientoDtos$LineaStockInicial",
                "com.inventario.web.dto.MovimientoDtos$MovimientoResponse",
                "com.inventario.web.dto.MovimientoDtos$DetalleResponse"
        );

        // DTOs - Subscriptions / Billing
        registerTypes(hints,
                "com.inventario.web.dto.billing.BillingDtos$BillingWebhookRequest",
                "com.inventario.web.dto.billing.BillingDtos$PaymentConfirmationResponse",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanSolicitudRequest",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanSolicitudResponse",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanCancelacionResponse"
        );
    }

    private void registerTypes(RuntimeHints hints, String... classNames) {
        for (String className : classNames) {
            hints.reflection().registerType(TypeReference.of(className),
                    MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS,
                    MemberCategory.INVOKE_PUBLIC_METHODS);
        }
    }
}

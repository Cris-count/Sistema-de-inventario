package com.inventario.config;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;

import java.util.stream.Stream;

/**
 * Registra clases requeridas por reflexión en tiempo de compilación AOT para GraalVM Native Image.
 * Especialmente necesario para bibliotecas como JJWT y dev.samstevens.totp que cargan constructores
 * u otras clases estáticas dinámicamente.
 * También se incluyen los DTOs de Jackson si son cargados dinámicamente.
 */
public class SecurityHintsRegistrar implements RuntimeHintsRegistrar {

    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        
        // 1. JJWT (io.jsonwebtoken) - Clases internas de implementación y algoritmos
        Stream.of(
                "io.jsonwebtoken.impl.DefaultJwtBuilder",
                "io.jsonwebtoken.impl.DefaultJwtParser",
                "io.jsonwebtoken.impl.DefaultJwtParserBuilder",
                "io.jsonwebtoken.impl.security.ProviderKey",
                "io.jsonwebtoken.impl.security.StandardSecureDigestAlgorithms",
                "io.jsonwebtoken.impl.security.StandardSignatureAlgorithms",
                "io.jsonwebtoken.impl.security.DefaultAeadAlgorithm",
                "io.jsonwebtoken.impl.security.DefaultMacAlgorithm",
                "io.jsonwebtoken.impl.security.StandardEncryptionAlgorithms",
                "io.jsonwebtoken.impl.security.StandardKeyAlgorithms",
                "io.jsonwebtoken.impl.security.ConstantKeyLocator",
                "io.jsonwebtoken.impl.security.LocatingKeyResolver",
                "io.jsonwebtoken.impl.security.RsaSignatureAlgorithm",
                "io.jsonwebtoken.impl.security.EcdsaSignatureAlgorithm",
                "io.jsonwebtoken.impl.security.EdSignatureAlgorithm",
                "io.jsonwebtoken.impl.security.DefaultSecretKeyAlgorithm",
                "io.jsonwebtoken.jackson.io.JacksonSerializer",
                "io.jsonwebtoken.jackson.io.JacksonDeserializer"
        ).forEach(className -> registerClassIfPresent(className, hints, classLoader));

        // 2. TOTP (dev.samstevens.totp)
        Stream.of(
                "dev.samstevens.totp.secret.DefaultSecretGenerator",
                "dev.samstevens.totp.code.DefaultCodeGenerator",
                "dev.samstevens.totp.code.DefaultCodeVerifier",
                "dev.samstevens.totp.time.SystemTimeProvider",
                "dev.samstevens.totp.qr.ZxingPngQrGenerator",
                "dev.samstevens.totp.code.HashingAlgorithm"
        ).forEach(className -> registerClassIfPresent(className, hints, classLoader));

        // 3. Jackson DTOs (Inventario, Suscripciones, Auth, Empresa, Onboarding)
        Stream.of(
                "com.inventario.web.dto.EmpresaMiDtos$EmpresaMiUpdateRequest",
                "com.inventario.web.dto.LoginRequest",
                "com.inventario.web.dto.TokenResponse",
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
                "com.inventario.web.dto.MovimientoDtos$DetalleResponse",
                "com.inventario.web.dto.SimularCorreoStockDtos$SimularCorreoStockRequest",
                "com.inventario.web.dto.SimularCorreoStockDtos$SimularCorreoStockResponse",
                "com.inventario.web.dto.auth.AuthLoginResponse",
                "com.inventario.web.dto.auth.LogoutRequest",
                "com.inventario.web.dto.auth.MfaDisableRequest",
                "com.inventario.web.dto.auth.MfaEnableRequest",
                "com.inventario.web.dto.auth.MfaSetupResponse",
                "com.inventario.web.dto.auth.MfaVerifyRequest",
                "com.inventario.web.dto.auth.RefreshTokenRequest",
                "com.inventario.web.dto.billing.BillingDtos$BillingWebhookRequest",
                "com.inventario.web.dto.billing.BillingDtos$PaymentConfirmationResponse",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanSolicitudRequest",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanSolicitudResponse",
                "com.inventario.web.dto.empresa.CambioPlanDtos$CambioPlanCancelacionResponse",
                "com.inventario.web.dto.onboarding.OnboardingDtos$OnboardingRegisterRequest",
                "com.inventario.web.dto.onboarding.OnboardingDtos$PrepayCheckoutRequest",
                "com.inventario.web.dto.onboarding.OnboardingDtos$ConfirmPrepayRequest",
                "com.inventario.web.dto.onboarding.OnboardingDtos$CreatePrepayCheckoutResponse",
                "com.inventario.web.dto.onboarding.OnboardingDtos$EmpresaOnboardingDto",
                "com.inventario.web.dto.onboarding.OnboardingDtos$SuperAdminOnboardingDto",
                "com.inventario.web.dto.onboarding.OnboardingDtos$PublicPlanResponse",
                "com.inventario.web.dto.onboarding.OnboardingDtos$OnboardingRegisterResponse"
        ).forEach(className -> registerClassIfPresent(className, hints, classLoader));
    }

    private void registerClassIfPresent(String className, RuntimeHints hints, ClassLoader classLoader) {
        try {
            Class<?> clazz = Class.forName(className, false, classLoader);
            hints.reflection().registerType(
                    clazz,
                    MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS,
                    MemberCategory.INVOKE_PUBLIC_METHODS,
                    MemberCategory.INVOKE_DECLARED_CONSTRUCTORS,
                    MemberCategory.INVOKE_DECLARED_METHODS,
                    MemberCategory.DECLARED_FIELDS
            );
        } catch (ClassNotFoundException e) {
            // Ignorar si la clase no está en el classpath
        }
    }
}

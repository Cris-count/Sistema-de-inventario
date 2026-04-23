package com.inventario.web.controller;

import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.onboarding.OnboardingEmailVerificationService;
import com.inventario.service.onboarding.OnboardingPrepayService;
import com.inventario.service.onboarding.OnboardingService;
import com.inventario.web.dto.onboarding.OnboardingDtos.ConfirmPrepayRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.CreatePrepayCheckoutResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.PrepayCheckoutRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.SendEmailVerificationRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.SendEmailVerificationResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.VerifyEmailRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.VerifyEmailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final OnboardingEmailVerificationService emailVerificationService;
    private final OnboardingPrepayService onboardingPrepayService;
    private final ApplicationRateLimitService applicationRateLimitService;

    @PostMapping("/prepaid-checkout")
    @SecurityRequirements
    @Operation(
            summary = "Crear sesión Stripe (pago antes del registro)",
            description = "Tras elegir plan con precio > 0: devuelve checkoutUrl para redirigir al usuario. Requiere STRIPE_SECRET_KEY.")
    public ResponseEntity<CreatePrepayCheckoutResponse> prepaidCheckout(@Valid @RequestBody PrepayCheckoutRequest body) {
        return ResponseEntity.ok(onboardingPrepayService.createPrepayCheckout(body.planCodigo()));
    }

    @PostMapping("/confirm-prepaid-checkout")
    @SecurityRequirements
    @Operation(
            summary = "Confirmar pago prepago (vuelta desde Stripe)",
            description = "Verifica con Stripe y registra la sesión para exigirla en POST /register-company. Idempotente.")
    public ResponseEntity<Void> confirmPrepaidCheckout(@Valid @RequestBody ConfirmPrepayRequest body) {
        onboardingPrepayService.confirmPrepayCheckout(body.sessionId(), body.planCodigo());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/send-email-verification")
    @SecurityRequirements
    @Operation(
            summary = "Preparar Google Authenticator (TOTP)",
            description = "Paso previo al registro: crea o reutiliza un secreto TOTP para el correo y plan, y devuelve otpauthUri para mostrar el QR. No envía correo.")
    public ResponseEntity<SendEmailVerificationResponse> sendEmailVerification(
            @Valid @RequestBody SendEmailVerificationRequest body) {
        return ResponseEntity.ok(emailVerificationService.sendVerificationCode(body.email(), body.planCodigo()));
    }

    @PostMapping("/verify-email")
    @SecurityRequirements
    @Operation(
            summary = "Confirmar código TOTP (Google Authenticator)",
            description = "Valida el código de 6 dígitos y devuelve un token de sesión para POST /register-company como emailVerificationToken.")
    public ResponseEntity<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest body) {
        return ResponseEntity.ok(
                emailVerificationService.verifyCode(body.email(), body.planCodigo(), body.code()));
    }

    @PostMapping("/register-company")
    @SecurityRequirements
    @Operation(
            summary = "Registro transaccional de empresa",
            description = "Crea empresa, suscripción inicial, SUPER_ADMIN y opcionalmente PIN de compra en una sola transacción.")
    public ResponseEntity<OnboardingRegisterResponse> register(
            @Valid @RequestBody OnboardingRegisterRequest body, HttpServletRequest httpRequest) {
        applicationRateLimitService.assertOnboardingRegisterAllowed(httpRequest, body.superAdmin().email());
        return ResponseEntity.status(HttpStatus.CREATED).body(onboardingService.register(body));
    }
}

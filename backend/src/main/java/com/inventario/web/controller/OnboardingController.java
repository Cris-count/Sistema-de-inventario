package com.inventario.web.controller;

import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.onboarding.OnboardingEmailVerificationService;
import com.inventario.service.onboarding.OnboardingService;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterResponse;
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
    private final ApplicationRateLimitService applicationRateLimitService;

    @PostMapping("/send-email-verification")
    @SecurityRequirements
    @Operation(summary = "Enviar código de verificación al correo", description = "Paso previo al registro: valida que el correo exista enviando un código de 6 dígitos (en desarrollo se registra en log).")
    public ResponseEntity<SendEmailVerificationResponse> sendEmailVerification(
            @Valid @RequestBody SendEmailVerificationRequest body) {
        return ResponseEntity.ok(emailVerificationService.sendVerificationCode(body.email(), body.planCodigo()));
    }

    @PostMapping("/verify-email")
    @SecurityRequirements
    @Operation(summary = "Confirmar código de correo", description = "Devuelve un token de sesión que debes enviar en POST /register-company como emailVerificationToken.")
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

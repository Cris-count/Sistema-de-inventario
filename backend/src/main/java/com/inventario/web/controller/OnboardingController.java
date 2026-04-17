package com.inventario.web.controller;

import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.onboarding.OnboardingService;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterRequest;
import com.inventario.web.dto.onboarding.OnboardingDtos.OnboardingRegisterResponse;
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
    private final ApplicationRateLimitService applicationRateLimitService;

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

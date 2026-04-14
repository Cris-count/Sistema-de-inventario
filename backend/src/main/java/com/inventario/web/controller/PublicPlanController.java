package com.inventario.web.controller;

import com.inventario.service.onboarding.OnboardingService;
import com.inventario.web.dto.onboarding.OnboardingDtos.PublicPlanResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicPlanController {

    private final OnboardingService onboardingService;

    @GetMapping("/planes")
    @SecurityRequirements
    @Operation(summary = "Planes públicos", description = "Catálogo para onboarding y landing (sin autenticación).")
    public List<PublicPlanResponse> listPlanes() {
        return onboardingService.listPublicPlans();
    }
}

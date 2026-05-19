package com.inventario.web.controller;

import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.service.ai.recommendation.AiPurchaseSuggestionService;
import com.inventario.service.ai.recommendation.AiRecommendationLifecycleService;
import com.inventario.web.dto.ai.AiPurchaseSuggestionDto;
import com.inventario.web.dto.ai.AiRecommendationApiDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai/recommendations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI recommendations", description = "Recomendaciones persistidas del asistente (por empresa)")
public class AiRecommendationController {

    private final AiRecommendationLifecycleService lifecycleService;
    private final AiPurchaseSuggestionService purchaseSuggestionService;

    @GetMapping
    @PreAuthorize(
            "hasAnyAuthority('ADMIN','SUPER_ADMIN','GERENCIA','COMPRAS','AUX_BODEGA')")
    @Operation(summary = "Lista recomendaciones IA del tenant actual")
    public List<AiRecommendationApiDto> list(
            @RequestParam(value = "status", required = false) AiRecommendationStatus status) {
        return lifecycleService.listForCurrentUser(status).stream().map(AiRecommendationApiDto::from).toList();
    }

    @PostMapping("/{id}/accept")
    @PreAuthorize(
            "hasAnyAuthority('ADMIN','SUPER_ADMIN','GERENCIA','COMPRAS','AUX_BODEGA')")
    @Operation(summary = "Marca recomendación como aceptada (PENDING → ACCEPTED)")
    public AiRecommendationApiDto accept(@PathVariable Long id) {
        return AiRecommendationApiDto.from(lifecycleService.accept(id));
    }

    @PostMapping("/{id}/dismiss")
    @PreAuthorize(
            "hasAnyAuthority('ADMIN','SUPER_ADMIN','GERENCIA','COMPRAS','AUX_BODEGA')")
    @Operation(summary = "Descarta recomendación (PENDING → DISMISSED)")
    public AiRecommendationApiDto dismiss(@PathVariable Long id) {
        return AiRecommendationApiDto.from(lifecycleService.dismiss(id));
    }

    @PostMapping("/{id}/execute")
    @PreAuthorize(
            "hasAnyAuthority('ADMIN','SUPER_ADMIN','GERENCIA','COMPRAS','AUX_BODEGA')")
    @Operation(summary = "Marca como ejecutada tras flujo operativo (ACCEPTED → EXECUTED)")
    public AiRecommendationApiDto execute(@PathVariable Long id) {
        return AiRecommendationApiDto.from(lifecycleService.execute(id));
    }

    @PostMapping("/{id}/create-purchase-suggestion")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS')")
    @Operation(summary = "Crea un borrador de sugerencia de compra desde una recomendacion RESTOCK aceptada")
    public AiPurchaseSuggestionDto createPurchaseSuggestion(@PathVariable Long id) {
        return AiPurchaseSuggestionDto.from(purchaseSuggestionService.createDraftFromRecommendation(id));
    }
}

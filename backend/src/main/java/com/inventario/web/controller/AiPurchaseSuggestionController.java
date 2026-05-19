package com.inventario.web.controller;

import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import com.inventario.service.ai.recommendation.AiPurchaseSuggestionReviewService;
import com.inventario.web.dto.ai.AiPurchaseSuggestionActionResponseDto;
import com.inventario.web.dto.ai.AiPurchaseSuggestionResponseDto;
import com.inventario.web.dto.ai.AiPurchaseSuggestionUpdateRequestDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ai/purchase-suggestions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI purchase suggestions", description = "Revision de borradores de compra sugeridos por IA")
public class AiPurchaseSuggestionController {

    private final AiPurchaseSuggestionReviewService reviewService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS','GERENCIA')")
    @Operation(summary = "Lista borradores/sugerencias de compra IA del tenant actual")
    public List<AiPurchaseSuggestionResponseDto> list(
            @RequestParam(value = "status", required = false) AiPurchaseSuggestionStatus status) {
        return reviewService.list(status).stream().map(AiPurchaseSuggestionResponseDto::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS','GERENCIA')")
    @Operation(summary = "Obtiene una sugerencia de compra IA del tenant actual")
    public AiPurchaseSuggestionResponseDto get(@PathVariable Long id) {
        return AiPurchaseSuggestionResponseDto.from(reviewService.find(id));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS')")
    @Operation(summary = "Edita campos seguros de una sugerencia DRAFT")
    public AiPurchaseSuggestionResponseDto update(
            @PathVariable Long id, @RequestBody AiPurchaseSuggestionUpdateRequestDto request) {
        return AiPurchaseSuggestionResponseDto.from(reviewService.updateDraft(id, request));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS')")
    @Operation(summary = "Aprueba una sugerencia DRAFT sin crear compra final ni movimiento de stock")
    public AiPurchaseSuggestionActionResponseDto approve(@PathVariable Long id) {
        return AiPurchaseSuggestionActionResponseDto.from(reviewService.approve(id), "Sugerencia aprobada");
    }

    @PostMapping("/{id}/dismiss")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS')")
    @Operation(summary = "Descarta una sugerencia DRAFT")
    public AiPurchaseSuggestionActionResponseDto dismiss(@PathVariable Long id) {
        return AiPurchaseSuggestionActionResponseDto.from(reviewService.dismiss(id), "Sugerencia descartada");
    }
}

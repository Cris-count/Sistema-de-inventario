package com.inventario.web.dto.ai;

import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import com.inventario.domain.entity.Usuario;

import java.math.BigDecimal;
import java.time.Instant;

public record AiPurchaseSuggestionResponseDto(
        Long id,
        Long sourceRecommendationId,
        Long productId,
        String productName,
        String warehouseName,
        BigDecimal currentStock,
        BigDecimal minimumStock,
        BigDecimal quantitySoldLast30Days,
        BigDecimal suggestedQuantity,
        String priority,
        AiPurchaseSuggestionStatus status,
        String createdByName,
        Instant createdAt,
        Instant updatedAt,
        Instant approvedAt,
        Instant dismissedAt,
        String notes) {

    public static AiPurchaseSuggestionResponseDto from(AiPurchaseSuggestion e) {
        return new AiPurchaseSuggestionResponseDto(
                e.getId(),
                e.getSourceRecommendation().getId(),
                e.getProductId(),
                e.getProductName(),
                e.getWarehouseName(),
                e.getCurrentStock(),
                e.getMinimumStock(),
                e.getQuantitySoldLast30Days(),
                e.getSuggestedQuantity(),
                e.getPriority(),
                e.getStatus(),
                displayName(e.getCreatedBy()),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                e.getApprovedAt(),
                e.getDismissedAt(),
                e.getNotes());
    }

    private static String displayName(Usuario u) {
        if (u == null) {
            return null;
        }
        String nombre = u.getNombre() != null ? u.getNombre().trim() : "";
        String apellido = u.getApellido() != null ? u.getApellido().trim() : "";
        String full = (nombre + " " + apellido).trim();
        return !full.isBlank() ? full : u.getEmail();
    }
}

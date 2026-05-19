package com.inventario.web.dto.ai;

import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record AiPurchaseSuggestionDto(
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
        Long createdBy,
        Instant createdAt,
        Instant updatedAt,
        Instant approvedAt,
        Instant dismissedAt,
        String notes) {

    public static AiPurchaseSuggestionDto from(AiPurchaseSuggestion e) {
        return new AiPurchaseSuggestionDto(
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
                e.getCreatedBy().getId(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                e.getApprovedAt(),
                e.getDismissedAt(),
                e.getNotes());
    }
}

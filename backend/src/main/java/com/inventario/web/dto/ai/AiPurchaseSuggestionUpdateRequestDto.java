package com.inventario.web.dto.ai;

import java.math.BigDecimal;

public record AiPurchaseSuggestionUpdateRequestDto(
        BigDecimal suggestedQuantity,
        String notes,
        String warehouseName) {}

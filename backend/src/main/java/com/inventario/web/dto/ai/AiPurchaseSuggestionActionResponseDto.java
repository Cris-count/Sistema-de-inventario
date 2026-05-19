package com.inventario.web.dto.ai;

import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;

public record AiPurchaseSuggestionActionResponseDto(
        Long id,
        AiPurchaseSuggestionStatus status,
        String message,
        AiPurchaseSuggestionResponseDto suggestion) {

    public static AiPurchaseSuggestionActionResponseDto from(AiPurchaseSuggestion e, String message) {
        return new AiPurchaseSuggestionActionResponseDto(
                e.getId(),
                e.getStatus(),
                message,
                AiPurchaseSuggestionResponseDto.from(e));
    }
}

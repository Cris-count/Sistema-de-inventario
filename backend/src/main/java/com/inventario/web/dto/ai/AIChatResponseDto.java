package com.inventario.web.dto.ai;

import java.util.List;

/** Respuesta del asistente hacia Angular (camelCase). */
public record AIChatResponseDto(
        String answer,
        String intent,
        Double confidence,
        Boolean usedContext,
        List<AIRecommendationDto> recommendations
) {
    /** Fallback cuando FastAPI no está disponible o hay error de red (sin exponer stack traces). */
    public static AIChatResponseDto unavailable() {
        return new AIChatResponseDto(
                "The AI assistant is temporarily unavailable. Please try again later.",
                "ai_unavailable",
                0.0,
                false,
                List.of());
    }
}

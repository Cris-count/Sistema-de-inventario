package com.inventario.web.dto.ai;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.ArrayList;
import java.util.List;

/** Coincide con {@code AIChatResponse} en FastAPI; consume JSON snake_case. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiPythonChatResponsePayload(
        String answer,
        String intent,
        Double confidence,
        @JsonProperty("used_context") Boolean usedContext,
        List<AiPythonRecommendationPayload> recommendations
) {
    public AiPythonChatResponsePayload {
        recommendations = recommendations != null ? recommendations : new ArrayList<>();
    }
}

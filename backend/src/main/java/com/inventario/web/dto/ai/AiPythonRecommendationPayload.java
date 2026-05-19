package com.inventario.web.dto.ai;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Deserializa recomendaciones desde FastAPI ({@code code}/{@code detail} canónicos).
 * Acepta alias {@code type} y {@code description} por compatibilidad contractual.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiPythonRecommendationPayload(
        @JsonAlias("type") String code,
        String title,
        @JsonAlias("description") String detail,
        String priority,
        Double confidence,
        Map<String, Object> metadata
) {}

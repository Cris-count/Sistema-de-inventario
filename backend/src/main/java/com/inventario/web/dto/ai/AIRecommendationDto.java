package com.inventario.web.dto.ai;

import java.util.Map;

/**
 * Recomendación expuesta al cliente Angular (camelCase JSON).
 *
 * <p>Los campos provenientes del modelo Python ({@code code}, {@code detail}) se mapean a {@link #type()} y {@link #description()}.</p>
 */
public record AIRecommendationDto(
        String type,
        String title,
        String description,
        Double confidence,
        Map<String, Object> metadata
) {}

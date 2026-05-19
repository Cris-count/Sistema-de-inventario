package com.inventario.web.dto.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Contexto sanitizado enviado al microservicio Python (sin entidades JPA completas).
 *
 * <p>Listas heterogéneas como mapas para coincidir con el contrato FastAPI ({@code dict[str, Any]}).</p>
 */
public record AIContextDto(
        List<Map<String, Object>> products,
        List<Map<String, Object>> stock,
        List<Map<String, Object>> sales,
        List<Map<String, Object>> movements
) {
    public AIContextDto {
        products = products != null ? products : new ArrayList<>();
        stock = stock != null ? stock : new ArrayList<>();
        sales = sales != null ? sales : new ArrayList<>();
        movements = movements != null ? movements : new ArrayList<>();
    }

    public static AIContextDto empty() {
        return new AIContextDto(List.of(), List.of(), List.of(), List.of());
    }
}

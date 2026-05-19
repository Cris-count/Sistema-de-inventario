package com.inventario.service.ai.recommendation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;

import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Deriva un mapa plano y acotado para la API a partir de {@code metadata_json} almacenado.
 *
 * <p>Reglas: allowlist de claves, valores escalares solamente, truncate 120, fallo de parseo → vacío.</p>
 */
public final class AiRecommendationMetadataPreviewMapper {

    static final int MAX_VALUE_LENGTH = 120;

    private static final JsonMapper OM = JsonMapper.builder().build();

    private static final Set<String> ALLOWED_CAMEL =
            Set.of(
                    "productId",
                    "productName",
                    "currentStock",
                    "minimumStock",
                    "quantitySoldLast30Days",
                    "warehouseName",
                    "priority",
                    "riskLevel",
                    "period",
                    "movementType");

    private AiRecommendationMetadataPreviewMapper() {}

    public static Map<String, String> buildPreview(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }
        try {
            JsonNode root = OM.readTree(metadataJson);
            if (!root.isObject()) {
                return Map.of();
            }
            LinkedHashMap<String, String> out = new LinkedHashMap<>();
            Iterator<String> names = root.fieldNames();
            while (names.hasNext()) {
                String field = names.next();
                String canonical = toCanonicalFieldKey(field);
                if (canonical == null || !ALLOWED_CAMEL.contains(canonical)) {
                    continue;
                }
                JsonNode v = root.get(field);
                if (v == null || v.isNull() || v.isMissingNode()) {
                    continue;
                }
                if (v.isObject() || v.isArray()) {
                    continue;
                }
                String text = scalarToString(v);
                if (text.isEmpty()) {
                    continue;
                }
                String truncated = truncate(text, MAX_VALUE_LENGTH);
                out.putIfAbsent(canonical, truncated);
            }
            return out.isEmpty() ? Map.of() : Collections.unmodifiableMap(out);
        } catch (Exception e) {
            return Map.of();
        }
    }

    /** Exponer para tests de claves snake_case sin depender del JSON completo. */
    static String toCanonicalFieldKeyForTest(String raw) {
        return toCanonicalFieldKey(raw);
    }

    private static String toCanonicalFieldKey(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim();
        if (ALLOWED_CAMEL.contains(t)) {
            return t;
        }
        if (!t.contains("_")) {
            return null;
        }
        String camel = snakeToCamel(t);
        return ALLOWED_CAMEL.contains(camel) ? camel : null;
    }

    private static String snakeToCamel(String snake) {
        String[] parts = snake.split("_");
        if (parts.length == 0) {
            return snake;
        }
        StringBuilder sb = new StringBuilder(parts[0].toLowerCase(Locale.ROOT));
        for (int i = 1; i < parts.length; i++) {
            if (parts[i].isEmpty()) {
                continue;
            }
            String p = parts[i].toLowerCase(Locale.ROOT);
            sb.append(Character.toUpperCase(p.charAt(0)));
            if (p.length() > 1) {
                sb.append(p.substring(1));
            }
        }
        return sb.toString();
    }

    private static String scalarToString(JsonNode v) {
        if (v.isTextual()) {
            return v.asText().trim();
        }
        if (v.isNumber() || v.isBoolean()) {
            return v.asText().trim();
        }
        return "";
    }

    private static String truncate(String s, int max) {
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max);
    }
}

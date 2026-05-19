package com.inventario.service.ai.recommendation;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiRecommendationMetadataPreviewMapperTest {

    @Test
    void malformedJson_returnsEmptyMap() {
        assertTrue(AiRecommendationMetadataPreviewMapper.buildPreview("{").isEmpty());
        assertTrue(AiRecommendationMetadataPreviewMapper.buildPreview("not-json").isEmpty());
    }

    @Test
    void longStrings_truncatedTo120() {
        String longVal = "x".repeat(200);
        String json = "{\"period\": \"" + longVal + "\"}";
        Map<String, String> m = AiRecommendationMetadataPreviewMapper.buildPreview(json);
        assertEquals(120, m.get("period").length());
        assertEquals("x".repeat(120), m.get("period"));
    }

    @Test
    void nestedObjects_ignored() {
        String json =
                """
                {"productId": 7, "nlu": {"language": "es"}, "extra": {"a": 1}}
                """;
        Map<String, String> m = AiRecommendationMetadataPreviewMapper.buildPreview(json);
        assertEquals("7", m.get("productId"));
        assertFalse(m.containsKey("nlu"));
        assertFalse(m.containsKey("extra"));
    }

    @Test
    void nonAllowlistedKeys_ignored() {
        String json = "{\"secret\": \"x\", \"code\": \"y\"}";
        assertTrue(AiRecommendationMetadataPreviewMapper.buildPreview(json).isEmpty());
    }

    @Test
    void allowlistedFlatValues_preservedIncludingSnakeCase() {
        String json =
                """
                {"product_id": 42, "warehouse_name": "Bodega Norte", "priority": "high"}
                """;
        Map<String, String> m = AiRecommendationMetadataPreviewMapper.buildPreview(json);
        assertEquals("42", m.get("productId"));
        assertEquals("Bodega Norte", m.get("warehouseName"));
        assertEquals("high", m.get("priority"));
    }

    @Test
    void arraysIgnored() {
        String json = "{\"period\": \"last_30_days\", \"tags\": [1,2,3]}";
        Map<String, String> m = AiRecommendationMetadataPreviewMapper.buildPreview(json);
        assertEquals("last_30_days", m.get("period"));
        assertFalse(m.containsKey("tags"));
    }
}

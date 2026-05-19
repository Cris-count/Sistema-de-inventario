package com.inventario.service.ai.recommendation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.AiPurchaseSuggestionRepository;
import com.inventario.domain.repository.AiRecommendationRepository;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiPurchaseSuggestionService {

    private static final String ACCEPTED_RESTOCK_REQUIRED =
            "Only accepted RESTOCK recommendations can generate purchase suggestions.";

    private final AiRecommendationRepository recommendationRepository;
    private final AiPurchaseSuggestionRepository suggestionRepository;
    private final AiTenantScopeService tenantScopeService;
    private final ObjectMapper objectMapper;

    @Transactional
    public AiPurchaseSuggestion createDraftFromRecommendation(Long recommendationId) {
        Usuario user = tenantScopeService.requireCurrentUsuarioWithEmpresa();
        Long empresaId = user.getEmpresa().getId();
        AiRecommendation recommendation = recommendationRepository
                .findByIdAndEmpresa_Id(recommendationId, empresaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND, "Recomendacion no encontrada o no pertenece a tu empresa."));

        if (!isRestock(recommendation)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La recomendacion no es de tipo RESTOCK.");
        }
        if (recommendation.getStatus() != AiRecommendationStatus.ACCEPTED) {
            throw new BusinessException(HttpStatus.CONFLICT, ACCEPTED_RESTOCK_REQUIRED);
        }
        Optional<AiPurchaseSuggestion> existing =
                suggestionRepository.findByEmpresa_IdAndSourceRecommendation_Id(empresaId, recommendationId);
        if (existing.isPresent()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "Ya existe una sugerencia de compra para esta recomendacion.");
        }

        RecommendationMetadata metadata = RecommendationMetadata.from(recommendation.getMetadataJson(), objectMapper);
        AiPurchaseSuggestion draft = AiPurchaseSuggestion.builder()
                .empresa(user.getEmpresa())
                .sourceRecommendation(recommendation)
                .productId(metadata.longValue("productId"))
                .productName(metadata.stringValue("productName"))
                .warehouseName(metadata.stringValue("warehouseName"))
                .currentStock(metadata.decimalValue("currentStock"))
                .minimumStock(metadata.decimalValue("minimumStock"))
                .quantitySoldLast30Days(metadata.decimalValue("quantitySoldLast30Days"))
                .suggestedQuantity(suggestQuantity(
                        metadata.decimalValue("currentStock"),
                        metadata.decimalValue("minimumStock"),
                        metadata.decimalValue("quantitySoldLast30Days")))
                .priority(firstText(metadata.stringValue("priority"), recommendation.getPriority()))
                .status(AiPurchaseSuggestionStatus.DRAFT)
                .createdBy(user)
                .build();
        return suggestionRepository.save(draft);
    }

    private static boolean isRestock(AiRecommendation recommendation) {
        String code = recommendation.getRecommendationCode();
        return code != null && code.trim().toUpperCase(Locale.ROOT).startsWith("RESTOCK");
    }

    static BigDecimal suggestQuantity(BigDecimal currentStock, BigDecimal minimumStock, BigDecimal quantitySoldLast30Days) {
        BigDecimal suggested = BigDecimal.ONE;
        if (minimumStock != null && currentStock != null) {
            suggested = minimumStock.multiply(new BigDecimal("2")).subtract(currentStock).max(BigDecimal.ONE);
        }
        if (quantitySoldLast30Days != null && quantitySoldLast30Days.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal salesFloor = quantitySoldLast30Days.divide(new BigDecimal("2"), 0, RoundingMode.CEILING);
            suggested = suggested.max(salesFloor);
        }
        return suggested.setScale(4, RoundingMode.HALF_UP);
    }

    private static String firstText(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred.trim();
        }
        return fallback != null && !fallback.isBlank() ? fallback.trim() : null;
    }

    private record RecommendationMetadata(Map<String, JsonNode> values) {

        static RecommendationMetadata from(String metadataJson, ObjectMapper objectMapper) {
            if (metadataJson == null || metadataJson.isBlank()) {
                return new RecommendationMetadata(Map.of());
            }
            try {
                JsonNode root = objectMapper.readTree(metadataJson);
                if (!root.isObject()) {
                    return new RecommendationMetadata(Map.of());
                }
                Map<String, JsonNode> values = new HashMap<>();
                putIfFound(values, "productId", root, "productId", "product_id");
                putIfFound(values, "productName", root, "productName", "product_name");
                putIfFound(values, "warehouseName", root, "warehouseName", "warehouse_name");
                putIfFound(values, "currentStock", root, "currentStock", "current_stock");
                putIfFound(values, "minimumStock", root, "minimumStock", "minimum_stock");
                putIfFound(values, "quantitySoldLast30Days", root, "quantitySoldLast30Days", "quantity_sold_last30_days");
                putIfFound(values, "priority", root, "priority");
                return new RecommendationMetadata(Map.copyOf(values));
            } catch (Exception e) {
                return new RecommendationMetadata(Map.of());
            }
        }

        String stringValue(String key) {
            JsonNode node = values.get(key);
            if (node == null || node.isNull() || node.isObject() || node.isArray()) {
                return null;
            }
            String text = node.asText(null);
            return text != null && !text.isBlank() ? text.trim() : null;
        }

        Long longValue(String key) {
            JsonNode node = values.get(key);
            if (node == null || node.isNull()) {
                return null;
            }
            if (node.canConvertToLong()) {
                return node.asLong();
            }
            try {
                String text = node.asText();
                return text == null || text.isBlank() ? null : Long.valueOf(text.trim());
            } catch (Exception e) {
                return null;
            }
        }

        BigDecimal decimalValue(String key) {
            JsonNode node = values.get(key);
            if (node == null || node.isNull()) {
                return null;
            }
            try {
                if (node.isNumber()) {
                    return node.decimalValue();
                }
                String text = node.asText();
                return text == null || text.isBlank() ? null : new BigDecimal(text.trim());
            } catch (Exception e) {
                return null;
            }
        }

        private static JsonNode find(JsonNode root, String... keys) {
            for (String key : keys) {
                JsonNode node = root.get(key);
                if (node != null && !node.isMissingNode()) {
                    return node;
                }
            }
            return null;
        }

        private static void putIfFound(Map<String, JsonNode> values, String target, JsonNode root, String... keys) {
            JsonNode node = find(root, keys);
            if (node != null && !node.isNull()) {
                values.put(target, node);
            }
        }
    }
}

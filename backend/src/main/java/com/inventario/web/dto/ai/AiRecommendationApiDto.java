package com.inventario.web.dto.ai;

import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.service.ai.recommendation.AiRecommendationMetadataPreviewMapper;

import java.time.Instant;
import java.util.Map;

/** API pública para filas persistidas tras un turno de chat IA. */
public record AiRecommendationApiDto(
        Long id,
        AiRecommendationStatus status,
        String code,
        String title,
        String detail,
        Double confidence,
        String priority,
        String chatIntent,
        Double chatConfidence,
        Boolean usedContext,
        Instant createdAt,
        Instant updatedAt,
        Map<String, String> metadataPreview) {

    public static AiRecommendationApiDto from(AiRecommendation e) {
        return new AiRecommendationApiDto(
                e.getId(),
                e.getStatus(),
                e.getRecommendationCode(),
                e.getTitle(),
                e.getDetail(),
                e.getConfidence(),
                e.getPriority(),
                e.getChatIntent(),
                e.getChatConfidence(),
                e.getUsedContext(),
                e.getCreatedAt(),
                e.getUpdatedAt(),
                AiRecommendationMetadataPreviewMapper.buildPreview(e.getMetadataJson()));
    }
}

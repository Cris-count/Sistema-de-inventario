package com.inventario.domain.repository;

import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AiPurchaseSuggestionRepository extends JpaRepository<AiPurchaseSuggestion, Long> {

    boolean existsByEmpresa_IdAndSourceRecommendation_Id(Long empresaId, Long sourceRecommendationId);

    Optional<AiPurchaseSuggestion> findByEmpresa_IdAndSourceRecommendation_Id(Long empresaId, Long sourceRecommendationId);

    List<AiPurchaseSuggestion> findByEmpresa_IdAndStatusOrderByCreatedAtDesc(
            Long empresaId, AiPurchaseSuggestionStatus status);

    List<AiPurchaseSuggestion> findByEmpresa_IdOrderByCreatedAtDesc(Long empresaId);

    Optional<AiPurchaseSuggestion> findByIdAndEmpresa_Id(Long id, Long empresaId);
}

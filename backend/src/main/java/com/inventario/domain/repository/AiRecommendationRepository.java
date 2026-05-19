package com.inventario.domain.repository;

import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AiRecommendationRepository extends JpaRepository<AiRecommendation, Long> {

    boolean existsByEmpresa_IdAndDedupeKeyAndCreatedAtAfter(
            Long empresaId, String dedupeKey, Instant createdAfter);

    List<AiRecommendation> findByEmpresa_IdAndStatusOrderByCreatedAtDesc(
            Long empresaId, AiRecommendationStatus status);

    List<AiRecommendation> findByEmpresa_IdOrderByCreatedAtDesc(Long empresaId);

    Optional<AiRecommendation> findByIdAndEmpresa_Id(Long id, Long empresaId);
}

package com.inventario.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
        name = "ai_recommendation",
        indexes = {
            @Index(name = "idx_ai_reco_empresa_status", columnList = "empresa_id,status"),
            @Index(name = "idx_ai_reco_empresa_dedupe_created", columnList = "empresa_id,dedupe_key,created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private AiRecommendationStatus status = AiRecommendationStatus.PENDING;

    /** Código estable (p. ej. RESTOCK_SKU o type alias desde Python). */
    @Column(name = "recommendation_code", nullable = false, length = 128)
    private String recommendationCode;

    @Column(length = 500)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private Double confidence;

    @Column(length = 64)
    private String priority;

    @Column(name = "chat_intent", length = 128)
    private String chatIntent;

    @Column(name = "chat_confidence")
    private Double chatConfidence;

    @Column(name = "used_context")
    private Boolean usedContext;

    /** Huella determinista para deduplicar persistencia en ventana de 24 h. */
    @Column(name = "dedupe_key", nullable = false, length = 64)
    private String dedupeKey;

    /** Metadatos tal como llegaron del microservicio (JSON). */
    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}

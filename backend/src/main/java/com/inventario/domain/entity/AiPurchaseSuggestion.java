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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "ai_purchase_suggestion",
        uniqueConstraints = {
            @UniqueConstraint(
                    name = "uk_ai_purchase_suggestion_source_recommendation",
                    columnNames = "source_recommendation_id")
        },
        indexes = {
            @Index(name = "idx_ai_purchase_suggestion_empresa_status", columnList = "empresa_id,status"),
            @Index(name = "idx_ai_purchase_suggestion_empresa_created", columnList = "empresa_id,created_at")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiPurchaseSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_recommendation_id", nullable = false)
    private AiRecommendation sourceRecommendation;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "warehouse_name", length = 255)
    private String warehouseName;

    @Column(name = "current_stock", precision = 14, scale = 4)
    private BigDecimal currentStock;

    @Column(name = "minimum_stock", precision = 14, scale = 4)
    private BigDecimal minimumStock;

    @Column(name = "quantity_sold_last30_days", precision = 14, scale = 4)
    private BigDecimal quantitySoldLast30Days;

    @Column(name = "suggested_quantity", nullable = false, precision = 14, scale = 4)
    private BigDecimal suggestedQuantity;

    @Column(length = 64)
    private String priority;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private AiPurchaseSuggestionStatus status = AiPurchaseSuggestionStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_usuario_id", nullable = false)
    private Usuario createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "dismissed_at")
    private Instant dismissedAt;

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

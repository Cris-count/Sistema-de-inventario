package com.inventario.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "onboarding_prepaid_checkout")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingPrepaidCheckout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stripe_session_id", nullable = false, unique = true, length = 255)
    private String stripeSessionId;

    @Column(name = "plan_codigo", nullable = false, length = 64)
    private String planCodigo;

    @Column(name = "paid_at", nullable = false)
    private Instant paidAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

package com.inventario.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "saas_compra")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SaasCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "suscripcion_id", nullable = false)
    private Suscripcion suscripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private SaasCompraTipo tipo;

    /** Plan objetivo del cambio; nulo en compras de onboarding. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_destino_id")
    private SaasPlan planDestino;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private EstadoCompra estado;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto;

    @Column(nullable = false, length = 8)
    private String moneda;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

package com.inventario.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venta")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bodega_id", nullable = false)
    private Bodega bodega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    /** Nulo mientras {@link #estado} es {@link VentaEstado#PENDIENTE_PAGO}; obligatorio al confirmar. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_id", unique = true)
    private Movimiento movimiento;

    @Column(name = "codigo_publico", nullable = false, length = 32)
    private String codigoPublico;

    @Column(name = "fecha_venta", nullable = false)
    private Instant fechaVenta;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private VentaEstado estado;

    @Column(columnDefinition = "TEXT")
    private String observacion;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "pago_estado", length = 24)
    private VentaPagoEstado pagoEstado;

    @Column(name = "stripe_checkout_session_id", length = 255)
    private String stripeCheckoutSessionId;

    @Column(name = "stripe_payment_intent_id", length = 255)
    private String stripePaymentIntentId;

    @Column(name = "paid_at")
    private Instant paidAt;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VentaDetalle> detalles = new ArrayList<>();
}

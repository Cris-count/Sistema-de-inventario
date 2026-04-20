package com.inventario.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pedido_proveedor_mensaje")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedidoProveedorMensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bodega_id", nullable = false)
    private Bodega bodega;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id", nullable = false)
    private Proveedor proveedor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PedidoProveedorMensajeOrigen origen;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PedidoProveedorMensajeEstado estado;

    @Column(name = "cantidad_sugerida", nullable = false, precision = 14, scale = 4)
    private BigDecimal cantidadSugerida;

    @Column(name = "cantidad_para_proveedor", nullable = false, precision = 14, scale = 4)
    private BigDecimal cantidadParaProveedor;

    @Column(name = "existencia_snapshot", nullable = false, precision = 14, scale = 4)
    private BigDecimal existenciaSnapshot;

    @Column(name = "stock_minimo_snapshot", nullable = false, precision = 14, scale = 4)
    private BigDecimal stockMinimoSnapshot;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;

    @Column(name = "resuelto_en")
    private Instant resueltoEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resuelto_por_usuario_id")
    private Usuario resueltoPor;

    @Column(name = "notas_admin", columnDefinition = "TEXT")
    private String notasAdmin;
}

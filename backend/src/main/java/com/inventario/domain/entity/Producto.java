package com.inventario.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "producto",
        uniqueConstraints = @UniqueConstraint(name = "uk_producto_empresa_codigo", columnNames = {"empresa_id", "codigo"})
)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 64)
    private String codigo;

    @Column(nullable = false, length = 255)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida;

    @Column(name = "stock_minimo", nullable = false, precision = 14, scale = 4)
    private BigDecimal stockMinimo;

    @Column(name = "purchase_cost", nullable = false, precision = 14, scale = 4)
    private BigDecimal purchaseCost;

    @Column(name = "sale_price", nullable = false, precision = 14, scale = 4)
    private BigDecimal salePrice;

    /** Proveedor habitual para reposición (alertas de stock bajo). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_preferido_id")
    @JsonIgnore
    private Proveedor proveedorPreferido;

    @Column(nullable = false)
    private Boolean activo;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Usuario createdBy;

    @JsonProperty("proveedorPreferidoId")
    public Long getProveedorPreferidoId() {
        return proveedorPreferido != null ? proveedorPreferido.getId() : null;
    }
}

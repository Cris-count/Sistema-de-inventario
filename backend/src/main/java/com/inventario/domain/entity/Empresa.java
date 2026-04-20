package com.inventario.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.ConstraintMode;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "empresa")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nombre;

    /** Identificación tributaria u otro documento de la empresa (NIT, RUC, etc.). */
    @Column(nullable = false, length = 32)
    private String identificacion;

    @Column(name = "email_contacto", length = 255)
    private String emailContacto;

    /** Correo para copia de alertas de stock bajo (pedidos a proveedor). Si es nulo, se usa {@link #emailContacto}. */
    @Column(name = "email_notificaciones_inventario", length = 255)
    private String emailNotificacionesInventario;

    @Builder.Default
    @Column(name = "alertas_pedido_proveedor_activas", nullable = false)
    private boolean alertasPedidoProveedorActivas = true;

    /** Tope de unidades a solicitar por correo en un solo aviso (nulo = sin límite en negocio; ver servicio). */
    @Column(name = "pedido_proveedor_cantidad_maxima", precision = 14, scale = 4)
    private BigDecimal pedidoProveedorCantidadMaxima;

    @Column(length = 40)
    private String telefono;

    @Column(length = 100)
    private String sector;

    @Column(length = 80)
    private String pais;

    @Column(length = 120)
    private String ciudad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EstadoEmpresa estado;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    /** Sin FK en DDL de Hibernate (evita ciclo empresa-usuario en create-drop); la FK real va en SQL/migraciones. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private Usuario updatedBy;
}

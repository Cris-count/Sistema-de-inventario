package com.inventario.domain.repository;

import com.inventario.domain.entity.VentaDetalle;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface VentaDetalleRepository extends JpaRepository<VentaDetalle, Long> {

    /**
     * Top productos por unidades vendidas (solo ventas confirmadas en el rango).
     */
    @Query(
            """
            SELECT d.producto.id, d.producto.codigo, d.producto.nombre, SUM(d.cantidad), SUM(d.subtotal)
            FROM VentaDetalle d JOIN d.venta v
            WHERE v.empresa.id = :empresaId AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            GROUP BY d.producto.id, d.producto.codigo, d.producto.nombre
            ORDER BY SUM(d.cantidad) DESC
            """)
    List<Object[]> topProductosPorCantidad(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter,
            Pageable pageable);
}

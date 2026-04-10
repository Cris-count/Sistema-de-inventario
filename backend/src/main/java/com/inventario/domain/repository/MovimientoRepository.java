package com.inventario.domain.repository;

import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.TipoMovimiento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {

    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto", "detalles.bodegaOrigen", "detalles.bodegaDestino"})
    @Override
    Optional<Movimiento> findById(Long id);

    @Query("""
            SELECT m FROM Movimiento m
            WHERE (:tipo IS NULL OR m.tipoMovimiento = :tipo)
              AND m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
            """)
    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    Page<Movimiento> findByTipoAndFechaBetween(
            @Param("tipo") TipoMovimiento tipo,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            Pageable pageable);

    @Query("""
            SELECT DISTINCT m FROM Movimiento m JOIN m.detalles d
            WHERE d.producto.id = :productoId
              AND m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
            ORDER BY m.fechaMovimiento ASC
            """)
    Page<Movimiento> findKardexByProducto(
            @Param("productoId") Long productoId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            Pageable pageable);
}

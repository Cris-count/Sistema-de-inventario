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
    @Query("SELECT m FROM Movimiento m WHERE m.id = :id AND m.empresa.id = :empresaId")
    Optional<Movimiento> findByIdAndEmpresaId(@Param("id") Long id, @Param("empresaId") Long empresaId);

    @Query("""
            SELECT m FROM Movimiento m
            WHERE m.empresa.id = :empresaId
              AND (:tipo IS NULL OR m.tipoMovimiento = :tipo)
              AND m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
            """)
    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    Page<Movimiento> findByEmpresaAndTipoAndFechaBetween(
            @Param("empresaId") Long empresaId,
            @Param("tipo") TipoMovimiento tipo,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            Pageable pageable);

    @Query("""
            SELECT DISTINCT m FROM Movimiento m JOIN m.detalles d
            WHERE m.empresa.id = :empresaId
              AND d.producto.id = :productoId
              AND m.fechaMovimiento >= :desde AND m.fechaMovimiento < :hasta
            ORDER BY m.fechaMovimiento ASC
            """)
    @EntityGraph(attributePaths = {"usuario", "detalles", "detalles.producto"})
    Page<Movimiento> findKardexByEmpresaAndProducto(
            @Param("empresaId") Long empresaId,
            @Param("productoId") Long productoId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            Pageable pageable);
}

package com.inventario.domain.repository;

import com.inventario.domain.entity.Venta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface VentaRepository extends JpaRepository<Venta, Long>, JpaSpecificationExecutor<Venta> {

    @Override
    @EntityGraph(attributePaths = {"usuario", "bodega", "movimiento", "cliente", "detalles"})
    Page<Venta> findAll(Specification<Venta> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "bodega", "movimiento", "detalles", "cliente"})
    Page<Venta> findByEmpresa_IdOrderByFechaVentaDesc(Long empresaId, Pageable pageable);

    @EntityGraph(attributePaths = {"usuario", "bodega", "movimiento", "detalles", "cliente"})
    Page<Venta> findByEmpresa_IdAndUsuario_IdOrderByFechaVentaDesc(Long empresaId, Long usuarioId, Pageable pageable);

    @EntityGraph(attributePaths = {"empresa", "usuario", "bodega", "movimiento", "detalles", "detalles.producto", "cliente"})
    Optional<Venta> findByIdAndEmpresa_Id(Long id, Long empresaId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @EntityGraph(attributePaths = {"empresa", "bodega", "usuario", "cliente", "detalles", "detalles.producto", "movimiento"})
    @Query("SELECT v FROM Venta v WHERE v.id = :id AND v.empresa.id = :empresaId")
    Optional<Venta> findByIdAndEmpresa_IdForUpdate(@Param("id") Long id, @Param("empresaId") Long empresaId);

    @Query("""
            SELECT COUNT(v) FROM Venta v
            WHERE v.empresa.id = :empresaId
              AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            """)
    long countEnRangoFecha(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT COALESCE(SUM(v.total), 0) FROM Venta v
            WHERE v.empresa.id = :empresaId
              AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            """)
    BigDecimal sumTotalesEnRangoFecha(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT COALESCE(SUM(d.cantidad), 0) FROM VentaDetalle d
            JOIN d.venta v
            WHERE v.empresa.id = :empresaId
              AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            """)
    BigDecimal sumUnidadesVendidasEnRangoFecha(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT COUNT(v) FROM Venta v
            WHERE v.empresa.id = :empresaId
              AND v.estado = 'ANULADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            """)
    long countAnuladasEnRangoFecha(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT COALESCE(SUM(v.total), 0) FROM Venta v
            WHERE v.empresa.id = :empresaId
              AND v.estado = 'ANULADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            """)
    BigDecimal sumTotalesAnuladasEnRangoFecha(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT v.usuario.id, v.usuario.email, COUNT(v), COALESCE(SUM(v.total), 0)
            FROM Venta v
            WHERE v.empresa.id = :empresaId AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            GROUP BY v.usuario.id, v.usuario.email
            ORDER BY COALESCE(SUM(v.total), 0) DESC
            """)
    List<Object[]> resumenPorVendedor(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @Query("""
            SELECT v.bodega.id, v.bodega.nombre, COUNT(v), COALESCE(SUM(v.total), 0)
            FROM Venta v
            WHERE v.empresa.id = :empresaId AND v.estado = 'CONFIRMADA'
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            GROUP BY v.bodega.id, v.bodega.nombre
            ORDER BY COALESCE(SUM(v.total), 0) DESC
            """)
    List<Object[]> resumenPorBodega(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);

    @EntityGraph(attributePaths = {"bodega", "usuario", "cliente", "movimiento"})
    @Query("""
            SELECT v FROM Venta v
            WHERE v.empresa.id = :empresaId
              AND v.fechaVenta >= :desde AND v.fechaVenta < :hasta
              AND (:usuarioFilter IS NULL OR v.usuario.id = :usuarioFilter)
            ORDER BY v.fechaVenta DESC
            """)
    List<Venta> findAllParaExport(
            @Param("empresaId") Long empresaId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioFilter") Long usuarioFilter);
}

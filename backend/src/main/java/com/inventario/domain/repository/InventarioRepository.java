package com.inventario.domain.repository;

import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.InventarioId;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventarioRepository extends JpaRepository<Inventario, InventarioId> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventario i WHERE i.id.productoId = :pid AND i.id.bodegaId = :bid")
    Optional<Inventario> findForUpdate(@Param("pid") Long productoId, @Param("bid") Long bodegaId);

    @Query("""
            SELECT i FROM Inventario i JOIN i.producto p
            WHERE p.empresa.id = :empresaId
              AND (:productoId IS NULL OR i.id.productoId = :productoId)
              AND (:bodegaId IS NULL OR i.id.bodegaId = :bodegaId)
            """)
    @EntityGraph(attributePaths = {"producto", "bodega"})
    Page<Inventario> buscarPorEmpresa(
            @Param("empresaId") Long empresaId,
            @Param("productoId") Long productoId,
            @Param("bodegaId") Long bodegaId,
            Pageable pageable);

    @Query("""
            SELECT i FROM Inventario i JOIN i.producto p
            WHERE p.empresa.id = :empresaId
              AND p.activo = true
              AND p.stockMinimo > 0
              AND i.cantidad <= p.stockMinimo
              AND (:bodegaId IS NULL OR i.id.bodegaId = :bodegaId)
            """)
    @EntityGraph(attributePaths = {"producto", "bodega"})
    List<Inventario> findBajoMinimoPorEmpresa(@Param("empresaId") Long empresaId, @Param("bodegaId") Long bodegaId);

    @Query("SELECT i.id.bodegaId FROM Inventario i WHERE i.id.productoId = :productoId")
    List<Long> findBodegaIdsByProductoId(@Param("productoId") Long productoId);
}

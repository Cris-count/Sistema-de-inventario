package com.inventario.domain.repository;

import com.inventario.domain.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long>, JpaSpecificationExecutor<Producto> {

    long countByEmpresa_Id(Long empresaId);

    /**
     * Lee la FK en BD sin depender de la asociación lazy (p. ej. alertas {@code @Async} tras commit).
     */
    @Query(
            value = "SELECT proveedor_preferido_id FROM producto WHERE id = :productoId AND empresa_id = :empresaId",
            nativeQuery = true)
    Long findProveedorPreferidoIdByIdAndEmpresa(
            @Param("productoId") long productoId, @Param("empresaId") long empresaId);

    Optional<Producto> findByIdAndEmpresaId(Long id, Long empresaId);

    Optional<Producto> findByEmpresaIdAndCodigo(Long empresaId, String codigo);

    boolean existsByEmpresaIdAndCodigo(Long empresaId, String codigo);
}

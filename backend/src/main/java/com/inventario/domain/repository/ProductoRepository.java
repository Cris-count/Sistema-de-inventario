package com.inventario.domain.repository;

import com.inventario.domain.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long>, JpaSpecificationExecutor<Producto> {

    long countByEmpresa_Id(Long empresaId);

    Optional<Producto> findByIdAndEmpresaId(Long id, Long empresaId);

    Optional<Producto> findByEmpresaIdAndCodigo(Long empresaId, String codigo);

    boolean existsByEmpresaIdAndCodigo(Long empresaId, String codigo);
}

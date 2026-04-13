package com.inventario.domain.repository;

import com.inventario.domain.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    List<Proveedor> findByEmpresaIdOrderByRazonSocialAsc(Long empresaId);

    Optional<Proveedor> findByIdAndEmpresaId(Long id, Long empresaId);
}

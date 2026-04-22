package com.inventario.domain.repository;

import com.inventario.domain.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByEmpresa_IdAndActivoIsTrueOrderByNombreAsc(Long empresaId, Pageable pageable);

    Optional<Cliente> findByIdAndEmpresa_Id(Long id, Long empresaId);

    /** Documento normalizado (trim) antes de llamar; null no se valida. */
    boolean existsByEmpresa_IdAndActivoIsTrueAndDocumentoIgnoreCase(Long empresaId, String documento);
}

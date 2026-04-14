package com.inventario.domain.repository;

import com.inventario.domain.entity.Bodega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BodegaRepository extends JpaRepository<Bodega, Long> {

    List<Bodega> findByEmpresaIdOrderByNombreAsc(Long empresaId);

    Optional<Bodega> findByIdAndEmpresaId(Long id, Long empresaId);

    Optional<Bodega> findByEmpresaIdAndCodigo(Long empresaId, String codigo);
}

package com.inventario.domain.repository;

import com.inventario.domain.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByEmpresaIdOrderByNombreAsc(Long empresaId);

    Optional<Categoria> findByIdAndEmpresaId(Long id, Long empresaId);
}

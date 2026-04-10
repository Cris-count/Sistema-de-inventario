package com.inventario.domain.repository;

import com.inventario.domain.entity.Bodega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BodegaRepository extends JpaRepository<Bodega, Long> {
    Optional<Bodega> findByCodigo(String codigo);
}

package com.inventario.domain.repository;

import com.inventario.domain.entity.Suscripcion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {

    Optional<Suscripcion> findByEmpresaId(Long empresaId);
}

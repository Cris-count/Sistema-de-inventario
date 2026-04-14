package com.inventario.domain.repository;

import com.inventario.domain.entity.SaasCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SaasCompraRepository extends JpaRepository<SaasCompra, Long> {

    Optional<SaasCompra> findBySuscripcionId(Long suscripcionId);
}

package com.inventario.domain.repository;

import com.inventario.domain.entity.EstadoCompra;
import com.inventario.domain.entity.SaasCompra;
import com.inventario.domain.entity.SaasCompraTipo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SaasCompraRepository extends JpaRepository<SaasCompra, Long> {

    Optional<SaasCompra> findBySuscripcionId(Long suscripcionId);

    boolean existsByEmpresa_IdAndTipoAndEstado(Long empresaId, SaasCompraTipo tipo, EstadoCompra estado);

    Optional<SaasCompra> findFirstByEmpresa_IdAndTipoAndEstadoOrderByIdDesc(
            Long empresaId, SaasCompraTipo tipo, EstadoCompra estado);
}

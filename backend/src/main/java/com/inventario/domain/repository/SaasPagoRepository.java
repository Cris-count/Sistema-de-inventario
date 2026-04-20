package com.inventario.domain.repository;

import com.inventario.domain.entity.EstadoPago;
import com.inventario.domain.entity.SaasPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface SaasPagoRepository extends JpaRepository<SaasPago, Long> {

    @Query("""
            SELECT p FROM SaasPago p
            JOIN FETCH p.compra c
            JOIN FETCH c.empresa e
            JOIN FETCH c.suscripcion s
            JOIN FETCH s.empresa se
            JOIN FETCH s.plan
            LEFT JOIN FETCH c.planDestino
            WHERE p.id = :id
            """)
    Optional<SaasPago> findByIdForConfirmation(@Param("id") Long id);

    Optional<SaasPago> findFirstByCompra_IdAndEstadoOrderByIdDesc(Long compraId, EstadoPago estado);

    List<SaasPago> findByCompra_IdAndEstado(Long compraId, EstadoPago estado);
}

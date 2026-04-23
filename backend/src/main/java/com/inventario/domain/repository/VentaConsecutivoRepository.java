package com.inventario.domain.repository;

import com.inventario.domain.entity.VentaConsecutivo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VentaConsecutivoRepository extends JpaRepository<VentaConsecutivo, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM VentaConsecutivo v WHERE v.empresaId = :empresaId")
    Optional<VentaConsecutivo> findByEmpresaIdForUpdate(@Param("empresaId") Long empresaId);
}

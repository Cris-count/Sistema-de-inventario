package com.inventario.domain.repository;

import com.inventario.domain.entity.MfaBackupCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MfaBackupCodeRepository extends JpaRepository<MfaBackupCode, Long> {

    /**
     * Bloquea todas las filas no consumidas del usuario (orden fijo → menos deadlocks).
     * Impide que dos transacciones lean el mismo conjunto como “disponible” antes de marcar {@code usedAt}.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM MfaBackupCode b WHERE b.usuario.id = :usuarioId AND b.usedAt IS NULL ORDER BY b.id")
    List<MfaBackupCode> lockUnusedByUsuarioIdForUpdate(@Param("usuarioId") Long usuarioId);

    @Modifying
    @Query("DELETE FROM MfaBackupCode b WHERE b.usuario.id = :usuarioId")
    void deleteByUsuarioId(@Param("usuarioId") Long usuarioId);
}

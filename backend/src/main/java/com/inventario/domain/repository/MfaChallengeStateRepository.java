package com.inventario.domain.repository;

import com.inventario.domain.entity.MfaChallengeState;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface MfaChallengeStateRepository extends JpaRepository<MfaChallengeState, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MfaChallengeState m WHERE m.jti = :jti")
    Optional<MfaChallengeState> findByJtiForUpdate(@Param("jti") String jti);

    @Modifying
    @Query("DELETE FROM MfaChallengeState m WHERE m.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}

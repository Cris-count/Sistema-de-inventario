package com.inventario.domain.repository;

import com.inventario.domain.entity.RefreshToken;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            """
            SELECT t FROM RefreshToken t
            JOIN FETCH t.usuario u
            JOIN FETCH u.empresa
            JOIN FETCH u.rol
            WHERE t.tokenHash = :hash
            """)
    Optional<RefreshToken> findByTokenHashForUpdate(@Param("hash") String hash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken t SET t.revokedAt = :now WHERE t.familyId = :familyId")
    int revokeAllInFamily(@Param("familyId") String familyId, @Param("now") Instant now);

    /**
     * Familias con al menos un token aún usable (no revocado, dentro de expiración por token y por familia).
     * Orden: familia iniciada antes primero (para revocar la más antigua al aplicar tope).
     */
    @Query(
            value =
                    "SELECT family_id FROM refresh_token WHERE usuario_id = :uid AND revoked_at IS NULL "
                            + "AND expires_at > :now AND family_expires_at > :now "
                            + "GROUP BY family_id ORDER BY MIN(issued_at) ASC",
            nativeQuery = true)
    List<String> findActiveFamilyIdsOldestFirst(@Param("uid") long uid, @Param("now") Instant now);
}

package com.inventario.service.mfa;

import com.inventario.domain.entity.MfaChallengeState;
import com.inventario.domain.repository.MfaChallengeStateRepository;
import com.inventario.web.error.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;

/**
 * Estado de challenge MFA en base de datos: límites de intentos y consumo único coherentes en cluster.
 * Activado por defecto ({@code app.mfa.state-store=jpa}).
 */
@Component
@ConditionalOnProperty(name = "app.mfa.state-store", havingValue = "jpa", matchIfMissing = true)
public class JpaMfaChallengeStateStore implements MfaChallengeStateStore {

    private final MfaChallengeStateRepository repository;
    private final int maxAttemptsPerChallenge;
    private final Duration rowTtl;

    public JpaMfaChallengeStateStore(
            MfaChallengeStateRepository repository,
            @Value("${app.mfa.max-challenge-attempts:5}") int maxAttemptsPerChallenge,
            @Value("${app.mfa.challenge-state-ttl-minutes:10}") int challengeStateTtlMinutes) {
        this.repository = repository;
        this.maxAttemptsPerChallenge = Math.max(1, maxAttemptsPerChallenge);
        this.rowTtl = Duration.ofMinutes(Math.max(5, challengeStateTtlMinutes));
    }

    @Override
    @Transactional
    public void assertChallengeUsable(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        String email = normalizeEmail(userEmailNormalized);
        Instant now = Instant.now();
        ensureRowExists(jti, email, now);
        MfaChallengeState row = repository.findByJtiForUpdate(jti).orElseThrow(
                () -> new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN));
        validateRow(row, email, now);
    }

    @Override
    @Transactional
    public void registerInvalidTotp(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        String email = normalizeEmail(userEmailNormalized);
        repository.findByJtiForUpdate(jti).ifPresent(row -> {
            if (!row.getEmail().equals(email) || row.isConsumed()) {
                return;
            }
            row.setFailureCount(row.getFailureCount() + 1);
            repository.save(row);
        });
    }

    @Override
    @Transactional
    public void consumeSuccessfully(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        String email = normalizeEmail(userEmailNormalized);
        MfaChallengeState row = repository.findByJtiForUpdate(jti).orElseThrow(
                () -> new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN));
        Instant now = Instant.now();
        validateRow(row, email, now);
        row.setConsumed(true);
        repository.save(row);
    }

    private void ensureRowExists(String jti, String email, Instant now) {
        if (repository.existsById(jti)) {
            return;
        }
        MfaChallengeState created = MfaChallengeState.builder()
                .jti(jti)
                .email(email)
                .failureCount(0)
                .consumed(false)
                .expiresAt(now.plus(rowTtl))
                .createdAt(now)
                .build();
        try {
            repository.saveAndFlush(created);
        } catch (DataIntegrityViolationException ignored) {
            // otra instancia insertó el mismo jti
        }
    }

    private void validateRow(MfaChallengeState row, String email, Instant now) {
        if (!row.getEmail().equals(email)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        if (row.getExpiresAt().isBefore(now)) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED,
                    "El desafío MFA expiró. Inicia sesión de nuevo.",
                    MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        if (row.isConsumed()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Este desafío MFA ya fue utilizado. Inicia sesión de nuevo.",
                    MfaBlockCodes.MFA_CHALLENGE_REUSED);
        }
        if (row.getFailureCount() >= maxAttemptsPerChallenge) {
            throw new BusinessException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos con este desafío. Solicita un nuevo inicio de sesión.",
                    MfaBlockCodes.MFA_TOO_MANY_ATTEMPTS);
        }
    }

    private static String normalizeEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase();
    }
}

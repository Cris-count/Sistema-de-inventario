package com.inventario.service.mfa;

import com.inventario.web.error.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Almacén en memoria (una sola JVM). Activar con {@code app.mfa.state-store=memory} (desarrollo o pruebas sin BD cluster).
 */
@Component
@ConditionalOnProperty(name = "app.mfa.state-store", havingValue = "memory")
public class InMemoryMfaChallengeStateStore implements MfaChallengeStateStore {

    private static final long EVICT_AFTER_MS = 600_000L;

    private final int maxAttemptsPerChallenge;
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();

    public InMemoryMfaChallengeStateStore(
            @Value("${app.mfa.max-challenge-attempts:5}") int maxAttemptsPerChallenge) {
        this.maxAttemptsPerChallenge = Math.max(1, maxAttemptsPerChallenge);
    }

    @Override
    public void assertChallengeUsable(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        String email = normalizeEmail(userEmailNormalized);
        Entry e = entries.computeIfAbsent(jti, k -> new Entry(email));
        if (e.email != null && !e.email.equals(email)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        if (e.email == null) {
            e.email = email;
        }
        if (e.consumed.get()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Este desafío MFA ya fue utilizado. Inicia sesión de nuevo.",
                    MfaBlockCodes.MFA_CHALLENGE_REUSED);
        }
        if (e.failures.get() >= maxAttemptsPerChallenge) {
            throw new BusinessException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiados intentos fallidos con este desafío. Solicita un nuevo inicio de sesión.",
                    MfaBlockCodes.MFA_TOO_MANY_ATTEMPTS);
        }
    }

    @Override
    public void registerInvalidTotp(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        String email = normalizeEmail(userEmailNormalized);
        Entry e = entries.computeIfAbsent(jti, k -> new Entry(email));
        if (e.email == null) {
            e.email = email;
        } else if (!e.email.equals(email)) {
            return;
        }
        e.failures.incrementAndGet();
    }

    @Override
    public void consumeSuccessfully(String jti, String userEmailNormalized) {
        if (jti == null || jti.isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        String email = normalizeEmail(userEmailNormalized);
        Entry e = entries.computeIfAbsent(jti, k -> new Entry(email));
        if (e.email == null) {
            e.email = email;
        } else if (!e.email.equals(email)) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        if (!e.consumed.compareAndSet(false, true)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Este desafío MFA ya fue utilizado.",
                    MfaBlockCodes.MFA_CHALLENGE_REUSED);
        }
    }

    @Scheduled(fixedRate = 120_000)
    public void evictStaleEntries() {
        long now = System.currentTimeMillis();
        entries.entrySet().removeIf(en -> now - en.getValue().createdAtMs > EVICT_AFTER_MS);
    }

    private static String normalizeEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase();
    }

    private static final class Entry {
        private volatile String email;
        private final AtomicInteger failures = new AtomicInteger(0);
        private final AtomicBoolean consumed = new AtomicBoolean(false);
        private final long createdAtMs = System.currentTimeMillis();

        private Entry(String initialEmail) {
            this.email = initialEmail == null || initialEmail.isBlank() ? null : initialEmail.trim().toLowerCase();
        }
    }
}

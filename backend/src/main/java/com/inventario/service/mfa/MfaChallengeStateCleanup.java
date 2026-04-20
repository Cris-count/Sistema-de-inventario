package com.inventario.service.mfa;

import com.inventario.domain.repository.MfaChallengeStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Purga filas expiradas del almacén JPA (evita crecimiento indefinido).
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.mfa.state-store", havingValue = "jpa", matchIfMissing = true)
public class MfaChallengeStateCleanup {

    private final MfaChallengeStateRepository repository;

    @Scheduled(fixedRateString = "${app.mfa.challenge-state-cleanup-ms:300000}")
    @Transactional
    public void purgeExpired() {
        repository.deleteExpired(Instant.now());
    }
}

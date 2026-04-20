package com.inventario.service.security;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class RefreshTokenServiceExpiryTest {

    @Test
    void computeTokenExpiresAt_capsByFamilyEnd() {
        Instant now = Instant.parse("2025-01-01T12:00:00Z");
        Instant familyEnd = Instant.parse("2025-01-10T12:00:00Z");
        Instant got = RefreshTokenService.computeTokenExpiresAt(now, familyEnd, 86_400_000L * 20L);
        assertThat(got).isEqualTo(familyEnd);
    }

    @Test
    void computeTokenExpiresAt_usesRotationWhenEarlierThanFamily() {
        Instant now = Instant.parse("2025-01-01T12:00:00Z");
        Instant familyEnd = Instant.parse("2026-01-01T12:00:00Z");
        Instant got = RefreshTokenService.computeTokenExpiresAt(now, familyEnd, 86_400_000L);
        assertThat(got).isEqualTo(Instant.parse("2025-01-02T12:00:00Z"));
    }
}

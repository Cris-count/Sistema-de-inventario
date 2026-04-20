package com.inventario.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "mfa_challenge_state")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaChallengeState {

    @Id
    @Column(name = "jti", nullable = false, length = 64)
    private String jti;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "failure_count", nullable = false)
    private int failureCount;

    @Column(name = "consumed", nullable = false)
    private boolean consumed;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

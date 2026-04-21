package com.inventario.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "onboarding_email_challenge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingEmailChallenge {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_VERIFIED = "VERIFIED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(name = "plan_codigo", nullable = false, length = 40)
    private String planCodigo;

    /** Hash del código por correo (flujo legado); nulo cuando el reto usa solo {@link #totpSecret}. */
    @Column(name = "code_hash", length = 64)
    private String codeHash;

    /** Secreto Base32 para TOTP pendiente de verificación; nulo en flujo solo correo. */
    @Column(name = "totp_secret", length = 64)
    private String totpSecret;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "session_token")
    private UUID sessionToken;

    @Column(name = "session_expires_at")
    private Instant sessionExpiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}

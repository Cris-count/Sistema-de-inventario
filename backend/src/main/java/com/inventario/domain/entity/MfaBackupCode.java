package com.inventario.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Código de respaldo MFA (hash BCrypt del valor en claro; el plano solo se muestra una vez en {@code /mfa/setup}).
 */
@Entity
@Table(name = "usuario_mfa_backup_code")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MfaBackupCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "used_at")
    private Instant usedAt;
}

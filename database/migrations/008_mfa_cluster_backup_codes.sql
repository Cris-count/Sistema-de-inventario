-- Estado de desafío MFA (cluster-safe) y códigos de respaldo hasheados.
CREATE TABLE IF NOT EXISTS mfa_challenge_state (
    jti           VARCHAR(64) PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    failure_count INT          NOT NULL DEFAULT 0,
    consumed      BOOLEAN      NOT NULL DEFAULT FALSE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenge_state_expires ON mfa_challenge_state (expires_at);

CREATE TABLE IF NOT EXISTS usuario_mfa_backup_code (
    id          BIGSERIAL PRIMARY KEY,
    usuario_id  BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    code_hash   VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuario_mfa_backup_usuario ON usuario_mfa_backup_code (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_mfa_backup_unused ON usuario_mfa_backup_code (usuario_id) WHERE used_at IS NULL;

COMMENT ON TABLE mfa_challenge_state IS 'Intentos y consumo único del JWT de challenge MFA (compartido entre instancias).';
COMMENT ON TABLE usuario_mfa_backup_code IS 'Códigos de respaldo MFA (solo hash BCrypt; el plano se muestra una vez en /mfa/setup).';

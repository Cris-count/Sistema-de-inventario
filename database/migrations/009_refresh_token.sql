-- Refresh tokens opacos: solo hash en BD, rotación y familia para detección de reutilización.
CREATE TABLE IF NOT EXISTS refresh_token (
    id                     BIGSERIAL PRIMARY KEY,
    usuario_id             BIGINT       NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash             VARCHAR(64)  NOT NULL UNIQUE,
    family_id              VARCHAR(36)  NOT NULL,
    issued_at              TIMESTAMPTZ  NOT NULL,
    expires_at             TIMESTAMPTZ  NOT NULL,
    revoked_at             TIMESTAMPTZ,
    replaced_by_token_id   BIGINT       REFERENCES refresh_token (id) ON DELETE SET NULL,
    last_used_at           TIMESTAMPTZ,
    created_from_ip        VARCHAR(64),
    user_agent             VARCHAR(512)
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_family ON refresh_token (family_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario ON refresh_token (usuario_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_usuario_active
    ON refresh_token (usuario_id) WHERE revoked_at IS NULL;

COMMENT ON TABLE refresh_token IS 'Sesiones de refresh: token opaco hasheado (SHA-256+pepper), rotación y familia para reuse detection.';

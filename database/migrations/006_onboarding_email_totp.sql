-- Verificación de correo en onboarding + TOTP (Google Authenticator) en lugar de PIN aleatorio.

BEGIN;

CREATE TABLE IF NOT EXISTS onboarding_email_challenge (
    id               BIGSERIAL PRIMARY KEY,
    email            VARCHAR(255) NOT NULL,
    plan_codigo      VARCHAR(40)  NOT NULL,
    code_hash        VARCHAR(64)  NOT NULL,
    expires_at       TIMESTAMPTZ  NOT NULL,
    status           VARCHAR(16)  NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'VERIFIED', 'CANCELLED')),
    session_token    UUID,
    session_expires_at TIMESTAMPTZ,
    consumed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_email_challenge_lookup
    ON onboarding_email_challenge (email, plan_codigo, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_email_challenge_session_token
    ON onboarding_email_challenge (session_token)
    WHERE session_token IS NOT NULL;

ALTER TABLE onboarding_pin ALTER COLUMN pin DROP NOT NULL;

ALTER TABLE onboarding_pin ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);

COMMENT ON COLUMN onboarding_pin.totp_secret IS 'Secreto Base32 para TOTP (Google Authenticator); pin legado opcional.';

COMMIT;

-- MFA TOTP (Google Authenticator) en el paso de onboarding: secreto en challenge pendiente.

BEGIN;

ALTER TABLE onboarding_email_challenge
    ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64);

ALTER TABLE onboarding_email_challenge
    ALTER COLUMN code_hash DROP NOT NULL;

COMMENT ON COLUMN onboarding_email_challenge.totp_secret IS 'Secreto Base32 pendiente de verificación TOTP; code_hash queda nulo en ese flujo.';

COMMIT;

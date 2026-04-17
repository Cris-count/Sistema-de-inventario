-- MFA (TOTP) por usuario: secreto en Base32; habilitación explícita tras verificar código.
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuario
    ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255);

COMMENT ON COLUMN usuario.mfa_enabled IS 'Si TRUE, el login exige segundo factor (TOTP) antes de emitir JWT de acceso.';
COMMENT ON COLUMN usuario.mfa_secret IS 'Secreto TOTP (Base32); nunca exponer por API salvo en setup inicial.';

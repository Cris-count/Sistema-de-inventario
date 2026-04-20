-- Ventana absoluta por familia de sesión (tope duro desde el primer refresh del login).
ALTER TABLE refresh_token ADD COLUMN IF NOT EXISTS family_expires_at TIMESTAMPTZ;

UPDATE refresh_token SET family_expires_at = expires_at WHERE family_expires_at IS NULL;

ALTER TABLE refresh_token ALTER COLUMN family_expires_at SET NOT NULL;

COMMENT ON COLUMN refresh_token.family_expires_at IS 'Fin absoluto de la familia (desde login); la rotación no lo extiende.';

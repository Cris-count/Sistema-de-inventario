-- Trazabilidad de última edición de empresa (perfil /mi).
-- Ejecutar tras002_multiempresa.sql si la columna aún no existe.

ALTER TABLE empresa ADD COLUMN IF NOT EXISTS updated_by BIGINT REFERENCES usuario (id) ON DELETE SET NULL;

COMMENT ON COLUMN empresa.updated_by IS 'Usuario que aplicó la última actualización vía API (p. ej. PUT /empresa/mi).';

-- Permite varias compras por suscripción (upgrade) y plan destino en cambios de plan.

BEGIN;

ALTER TABLE saas_compra DROP CONSTRAINT IF EXISTS saas_compra_suscripcion_id_key;

ALTER TABLE saas_compra ADD COLUMN IF NOT EXISTS tipo VARCHAR(32);
UPDATE saas_compra SET tipo = 'ONBOARDING' WHERE tipo IS NULL;
ALTER TABLE saas_compra ALTER COLUMN tipo SET DEFAULT 'ONBOARDING';
ALTER TABLE saas_compra ALTER COLUMN tipo SET NOT NULL;

ALTER TABLE saas_compra ADD COLUMN IF NOT EXISTS plan_destino_id BIGINT NULL REFERENCES saas_plan (id) ON DELETE RESTRICT;

ALTER TABLE saas_compra DROP CONSTRAINT IF EXISTS saas_compra_tipo_check;
ALTER TABLE saas_compra
    ADD CONSTRAINT saas_compra_tipo_check CHECK (tipo IN ('ONBOARDING', 'CAMBIO_PLAN'));

CREATE INDEX IF NOT EXISTS idx_saas_compra_suscripcion ON saas_compra (suscripcion_id);

COMMIT;

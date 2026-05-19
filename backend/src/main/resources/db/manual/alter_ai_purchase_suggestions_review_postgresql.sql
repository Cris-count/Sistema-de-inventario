-- Manual DDL for PostgreSQL installations that already created ai_purchase_suggestion
-- before the review workflow fields existed.
-- Ejecutar una vez si la tabla ya existe y spring.jpa.hibernate.ddl-auto=validate.

ALTER TABLE ai_purchase_suggestion
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE ai_purchase_suggestion
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE ai_purchase_suggestion
    ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Manual DDL for PostgreSQL when spring.jpa.hibernate.ddl-auto=validate (sin Flyway/Liquibase en este proyecto).
-- Ejecutar una vez contra la misma base configurada en SPRING_DATASOURCE_*.
-- Esta tabla guarda solo borradores de sugerencia de compra creados desde recomendaciones IA RESTOCK aceptadas.

CREATE TABLE IF NOT EXISTS ai_purchase_suggestion (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa (id),
    source_recommendation_id BIGINT NOT NULL REFERENCES ai_recommendation (id),
    product_id BIGINT,
    product_name VARCHAR(255),
    warehouse_name VARCHAR(255),
    current_stock NUMERIC(14, 4),
    minimum_stock NUMERIC(14, 4),
    quantity_sold_last30_days NUMERIC(14, 4),
    suggested_quantity NUMERIC(14, 4) NOT NULL,
    priority VARCHAR(64),
    notes TEXT,
    status VARCHAR(32) NOT NULL,
    created_by_usuario_id BIGINT NOT NULL REFERENCES usuario (id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    CONSTRAINT uk_ai_purchase_suggestion_source_recommendation UNIQUE (source_recommendation_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_purchase_suggestion_empresa_status
    ON ai_purchase_suggestion (empresa_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_purchase_suggestion_empresa_created
    ON ai_purchase_suggestion (empresa_id, created_at);

-- Tablas para funcionalidad IA (recomendaciones y borradores de compra).
-- Hibernate usa ddl-auto=validate: deben existir antes de arrancar el API.
-- Orden: ai_recommendation primero (FK desde ai_purchase_suggestion).

CREATE TABLE IF NOT EXISTS ai_recommendation (
    id BIGSERIAL PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresa (id),
    status VARCHAR(32) NOT NULL,
    recommendation_code VARCHAR(128) NOT NULL,
    title VARCHAR(500),
    detail TEXT,
    confidence DOUBLE PRECISION,
    priority VARCHAR(64),
    chat_intent VARCHAR(128),
    chat_confidence DOUBLE PRECISION,
    used_context BOOLEAN,
    dedupe_key VARCHAR(64) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ai_reco_empresa_status ON ai_recommendation (empresa_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_reco_empresa_dedupe_created ON ai_recommendation (empresa_id, dedupe_key, created_at);

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

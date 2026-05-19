-- Manual DDL for PostgreSQL when spring.jpa.hibernate.ddl-auto=validate (sin Flyway/Liquibase en este proyecto).
-- Ejecutar una vez contra la misma base configurada en SPRING_DATASOURCE_*.

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

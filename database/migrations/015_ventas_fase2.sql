-- Fase 2 ventas: cliente opcional, código público V-XXXXXX, consecutivo por empresa, estado ANULADA.

CREATE TABLE IF NOT EXISTS cliente (
    id          BIGSERIAL PRIMARY KEY,
    empresa_id  BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    nombre      VARCHAR(200) NOT NULL,
    documento   VARCHAR(32),
    telefono    VARCHAR(40),
    email       VARCHAR(255),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cliente_empresa ON cliente (empresa_id);
CREATE INDEX IF NOT EXISTS idx_cliente_empresa_nombre ON cliente (empresa_id, nombre);

CREATE TABLE IF NOT EXISTS venta_consecutivo (
    empresa_id BIGINT PRIMARY KEY REFERENCES empresa (id) ON DELETE RESTRICT,
    ultimo     BIGINT NOT NULL DEFAULT 0 CHECK (ultimo >= 0)
);

-- Venta: cliente opcional, código visible, ampliar estados
ALTER TABLE venta ADD COLUMN IF NOT EXISTS cliente_id BIGINT REFERENCES cliente (id) ON DELETE RESTRICT;
ALTER TABLE venta ADD COLUMN IF NOT EXISTS codigo_publico VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_venta_cliente ON venta (cliente_id) WHERE cliente_id IS NOT NULL;

UPDATE venta SET codigo_publico = 'V-' || LPAD(id::text, 6, '0') WHERE codigo_publico IS NULL;

ALTER TABLE venta ALTER COLUMN codigo_publico SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_venta_empresa_codigo_publico ON venta (empresa_id, codigo_publico);

INSERT INTO venta_consecutivo (empresa_id, ultimo)
SELECT v.empresa_id,
       COALESCE(MAX(CAST(SUBSTRING(v.codigo_publico FROM 3) AS BIGINT)), 0)
FROM venta v
WHERE v.codigo_publico ~ '^V-[0-9]+$'
GROUP BY v.empresa_id
ON CONFLICT (empresa_id) DO UPDATE SET ultimo = GREATEST(venta_consecutivo.ultimo, EXCLUDED.ultimo);

ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_estado_check;
ALTER TABLE venta ADD CONSTRAINT venta_estado_check CHECK (estado IN ('CONFIRMADA', 'ANULADA'));

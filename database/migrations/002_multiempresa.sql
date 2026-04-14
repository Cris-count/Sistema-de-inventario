-- ============================================================
-- Migración 002: multi-empresa (tenant por empresa_id)
--
-- Objetivo:
-- - Tabla empresa y FK empresa_id en tablas de negocio
-- - Unicidad de códigos/nombres/documentos por empresa (no global)
-- - empresa_id en movimiento para consultas y aislamiento
-- - Rol SUPER_ADMIN en catálogo
-- Empresa por defecto (desarrollo / datos existentes):
--   identificacion = 'DEV-DEFAULT-001'
--   nombre         = 'Empresa desarrollo (default)'
-- Todos los registros y usuarios sin empresa quedan asociados a esa fila.
--
-- Ejemplo: psql -h localhost -U inventario -d inventario -f database/migrations/002_multiempresa.sql
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS empresa (
    id             BIGSERIAL PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    identificacion VARCHAR(32)  NOT NULL UNIQUE,
    email_contacto VARCHAR(255),
    telefono       VARCHAR(40),
    estado         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

INSERT INTO empresa (nombre, identificacion, email_contacto, telefono, estado, created_at)
VALUES (
    'Empresa desarrollo (default)',
    'DEV-DEFAULT-001',
    'contacto@empresa-default.local',
    NULL,
    'ACTIVA',
    NOW()
)
ON CONFLICT (identificacion) DO NOTHING;

-- --- usuario ---
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
UPDATE usuario
SET empresa_id = (SELECT id FROM empresa WHERE identificacion = 'DEV-DEFAULT-001' LIMIT 1)
WHERE empresa_id IS NULL;
ALTER TABLE usuario ALTER COLUMN empresa_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuario_empresa ON usuario (empresa_id);

-- --- categoria ---
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
ALTER TABLE categoria ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES usuario (id) ON DELETE SET NULL;
UPDATE categoria
SET empresa_id = (SELECT id FROM empresa WHERE identificacion = 'DEV-DEFAULT-001' LIMIT 1)
WHERE empresa_id IS NULL;
ALTER TABLE categoria ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE categoria DROP CONSTRAINT IF EXISTS categoria_nombre_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_categoria_empresa_nombre ON categoria (empresa_id, nombre);

-- --- producto ---
ALTER TABLE producto ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
UPDATE producto p
SET empresa_id = c.empresa_id
FROM categoria c
WHERE c.id = p.categoria_id AND p.empresa_id IS NULL;
UPDATE producto
SET empresa_id = (SELECT id FROM empresa WHERE identificacion = 'DEV-DEFAULT-001' LIMIT 1)
WHERE empresa_id IS NULL;
ALTER TABLE producto ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE producto DROP CONSTRAINT IF EXISTS producto_codigo_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_producto_empresa_codigo ON producto (empresa_id, codigo);

-- --- bodega ---
ALTER TABLE bodega ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
ALTER TABLE bodega ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES usuario (id) ON DELETE SET NULL;
UPDATE bodega
SET empresa_id = (SELECT id FROM empresa WHERE identificacion = 'DEV-DEFAULT-001' LIMIT 1)
WHERE empresa_id IS NULL;
ALTER TABLE bodega ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE bodega DROP CONSTRAINT IF EXISTS bodega_codigo_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_bodega_empresa_codigo ON bodega (empresa_id, codigo);

-- --- proveedor ---
ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
ALTER TABLE proveedor ADD COLUMN IF NOT EXISTS created_by BIGINT REFERENCES usuario (id) ON DELETE SET NULL;
UPDATE proveedor
SET empresa_id = (SELECT id FROM empresa WHERE identificacion = 'DEV-DEFAULT-001' LIMIT 1)
WHERE empresa_id IS NULL;
ALTER TABLE proveedor ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE proveedor DROP CONSTRAINT IF EXISTS proveedor_documento_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_proveedor_empresa_documento ON proveedor (empresa_id, documento);

-- --- movimiento ---
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS empresa_id BIGINT REFERENCES empresa (id);
UPDATE movimiento m
SET empresa_id = u.empresa_id
FROM usuario u
WHERE u.id = m.usuario_id AND m.empresa_id IS NULL;
ALTER TABLE movimiento ALTER COLUMN empresa_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_movimiento_empresa ON movimiento (empresa_id);

INSERT INTO rol (codigo, nombre, descripcion)
VALUES ('SUPER_ADMIN', 'Super administrador', 'Administrador principal de la empresa (multi-tenant)')
ON CONFLICT (codigo) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_categoria_empresa ON categoria (empresa_id);
CREATE INDEX IF NOT EXISTS idx_producto_empresa ON producto (empresa_id);
CREATE INDEX IF NOT EXISTS idx_bodega_empresa ON bodega (empresa_id);
CREATE INDEX IF NOT EXISTS idx_proveedor_empresa ON proveedor (empresa_id);

COMMIT;

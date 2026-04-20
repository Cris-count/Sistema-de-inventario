-- Migración 004: planes SaaS, suscripción, onboarding comercial, datos extra de empresa.
-- Ejecutar tras las migraciones 002/003 en bases PostgreSQL existentes.

BEGIN;

ALTER TABLE empresa DROP CONSTRAINT IF EXISTS empresa_estado_check;

ALTER TABLE empresa
    ADD CONSTRAINT empresa_estado_check
        CHECK (estado IN ('ACTIVA', 'INACTIVA', 'EN_PRUEBA', 'COMERCIAL_PENDIENTE'));

ALTER TABLE empresa ADD COLUMN IF NOT EXISTS sector VARCHAR(100);
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS pais VARCHAR(80);
ALTER TABLE empresa ADD COLUMN IF NOT EXISTS ciudad VARCHAR(120);

CREATE TABLE IF NOT EXISTS saas_plan (
    id              BIGSERIAL PRIMARY KEY,
    codigo          VARCHAR(40)  NOT NULL UNIQUE,
    nombre          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    precio_mensual  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    moneda          VARCHAR(8)   NOT NULL DEFAULT 'USD',
    max_bodegas     INTEGER      NOT NULL DEFAULT 2,
    max_usuarios    INTEGER      NOT NULL DEFAULT 5,
    features TEXT,
    orden           INTEGER      NOT NULL DEFAULT 0,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suscripcion (
    id           BIGSERIAL PRIMARY KEY,
    empresa_id   BIGINT       NOT NULL UNIQUE REFERENCES empresa (id) ON DELETE RESTRICT,
    plan_id      BIGINT       NOT NULL REFERENCES saas_plan (id) ON DELETE RESTRICT,
    estado       VARCHAR(24)  NOT NULL
        CHECK (estado IN ('TRIAL', 'ACTIVA', 'PENDIENTE_PAGO', 'CANCELADA', 'EXPIRADA')),
    fecha_inicio TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    fecha_fin    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suscripcion_plan ON suscripcion (plan_id);
CREATE INDEX IF NOT EXISTS idx_suscripcion_estado ON suscripcion (estado);

CREATE TABLE IF NOT EXISTS onboarding_pin (
    id BIGSERIAL PRIMARY KEY,
    pin            VARCHAR(16)  NOT NULL UNIQUE,
    empresa_id     BIGINT       NOT NULL REFERENCES empresa (id) ON DELETE CASCADE,
    suscripcion_id BIGINT       NOT NULL REFERENCES suscripcion (id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_pin_empresa ON onboarding_pin (empresa_id);

INSERT INTO saas_plan (codigo, nombre, descripcion, precio_mensual, moneda, max_bodegas, max_usuarios, features, orden, activo)
SELECT v.codigo, v.nombre, v.descripcion, v.precio, v.moneda, v.max_bodegas, v.max_usuarios, v.features, v.orden, TRUE
FROM (
    VALUES
        ('STARTER',
         'Starter',
         'Control profesional de inventario desde el primer día.',
         19900.00,
         'COP',
         2,
         5,
         'Productos y categorías|Movimientos de entrada y salida|Consulta de existencias y alertas|Soporte por correo',
         1),
        ('PROFESIONAL',
         'Pro',
         'Diseñado para crecer con tu empresa: más bodegas, equipo ampliado y reportes.',
         69900.00,
         'COP',
         10,
         25,
         'Más bodegas y usuarios|Transferencias y ajustes|Proveedores y roles ampliados|Reportes kardex y exportación CSV',
         2),
        ('EMPRESA',
         'Empresarial',
         'Escala sin límites para operaciones que exigen el máximo control.',
         149900.00,
         'COP',
         999,
         999,
         'Límites ampliados en bodegas y usuarios|Módulos avanzados del plan|Prioridad en soporte|Hoja de ruta multi-sede e integraciones',
         3)
) AS v(codigo, nombre, descripcion, precio, moneda, max_bodegas, max_usuarios, features, orden)
WHERE NOT EXISTS (SELECT 1 FROM saas_plan p WHERE p.codigo = v.codigo);

COMMIT;

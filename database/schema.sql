-- ============================================================
-- Sistema de inventario - PASO 3 (PostgreSQL)
-- Ejecutar contra una base vacía o usar sección DROP en desarrollo.
-- ============================================================

SET client_encoding = 'UTF8';

-- Desarrollo: descomentar para recrear desde cero
-- DROP TABLE IF EXISTS movimiento_detalle CASCADE;
-- DROP TABLE IF EXISTS movimiento CASCADE;
-- DROP TABLE IF EXISTS inventario CASCADE;
-- DROP TABLE IF EXISTS producto CASCADE;
-- DROP TABLE IF EXISTS categoria CASCADE;
-- DROP TABLE IF EXISTS bodega CASCADE;
-- DROP TABLE IF EXISTS proveedor CASCADE;
-- DROP TABLE IF EXISTS usuario CASCADE;
-- DROP TABLE IF EXISTS rol CASCADE;

CREATE TABLE IF NOT EXISTS rol (
    id          BIGSERIAL PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    descripcion TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100),
    rol_id         BIGINT       NOT NULL REFERENCES rol (id) ON DELETE RESTRICT,
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario (rol_id);
CREATE INDEX IF NOT EXISTS idx_usuario_activo ON usuario (activo) WHERE activo = TRUE;

CREATE TABLE IF NOT EXISTS categoria (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS producto (
    id             BIGSERIAL PRIMARY KEY,
    codigo         VARCHAR(64)  NOT NULL UNIQUE,
    nombre         VARCHAR(255) NOT NULL,
    descripcion    TEXT,
    categoria_id   BIGINT       NOT NULL REFERENCES categoria (id) ON DELETE RESTRICT,
    unidad_medida  VARCHAR(20)  NOT NULL DEFAULT 'UND',
    stock_minimo   NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
    activo         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    created_by     BIGINT       REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT chk_producto_stock_min CHECK (stock_minimo >= 0)
);

CREATE INDEX IF NOT EXISTS idx_producto_categoria ON producto (categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_activo ON producto (activo);

CREATE TABLE IF NOT EXISTS bodega (
    id          BIGSERIAL PRIMARY KEY,
    codigo      VARCHAR(32)  NOT NULL UNIQUE,
    nombre      VARCHAR(150) NOT NULL,
    direccion   VARCHAR(255),
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS proveedor (
    id            BIGSERIAL PRIMARY KEY,
    documento     VARCHAR(32)  NOT NULL UNIQUE,
    razon_social  VARCHAR(255) NOT NULL,
    contacto      VARCHAR(150),
    telefono      VARCHAR(40),
    email         VARCHAR(255),
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS inventario (
    producto_id  BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    bodega_id    BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    cantidad     NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (producto_id, bodega_id)
);

CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON inventario (bodega_id);

CREATE TABLE IF NOT EXISTS movimiento (
    id                    BIGSERIAL PRIMARY KEY,
    tipo_movimiento       VARCHAR(30) NOT NULL
        CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE')),
    motivo                VARCHAR(80),
    fecha_movimiento      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    usuario_id            BIGINT      NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
    proveedor_id          BIGINT      REFERENCES proveedor (id) ON DELETE RESTRICT,
    referencia_documento  VARCHAR(64),
    observacion           TEXT,
    estado                VARCHAR(20) NOT NULL DEFAULT 'COMPLETADO'
        CHECK (estado IN ('COMPLETADO', 'ANULADO', 'BORRADOR')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_movimiento_fecha ON movimiento (fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimiento_usuario ON movimiento (usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_tipo ON movimiento (tipo_movimiento);
CREATE INDEX IF NOT EXISTS idx_movimiento_proveedor ON movimiento (proveedor_id) WHERE proveedor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS movimiento_detalle (
    id                  BIGSERIAL PRIMARY KEY,
    movimiento_id       BIGINT        NOT NULL REFERENCES movimiento (id) ON DELETE RESTRICT,
    producto_id         BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    cantidad            NUMERIC(14,4) NOT NULL CHECK (cantidad > 0),
    bodega_origen_id    BIGINT        REFERENCES bodega (id) ON DELETE RESTRICT,
    bodega_destino_id   BIGINT        REFERENCES bodega (id) ON DELETE RESTRICT,
    motivo_linea        VARCHAR(50),
    CONSTRAINT chk_detalle_bodegas_transfer
        CHECK (
            NOT (bodega_origen_id IS NOT NULL AND bodega_destino_id IS NOT NULL)
            OR (bodega_origen_id <> bodega_destino_id)
        )
);

CREATE INDEX IF NOT EXISTS idx_movdet_mov ON movimiento_detalle (movimiento_id);
CREATE INDEX IF NOT EXISTS idx_movdet_producto ON movimiento_detalle (producto_id);
CREATE INDEX IF NOT EXISTS idx_movdet_origen ON movimiento_detalle (bodega_origen_id);
CREATE INDEX IF NOT EXISTS idx_movdet_destino ON movimiento_detalle (bodega_destino_id);

COMMENT ON TABLE movimiento IS 'Cabecera de documento de inventario; trazabilidad por usuario y fecha.';
COMMENT ON TABLE movimiento_detalle IS 'Líneas: validar origen/destino según movimiento.tipo_movimiento en aplicación.';
COMMENT ON TABLE inventario IS 'Saldo actual por producto y bodega; actualizar en servicio transaccional junto al detalle.';

-- Roles base (idempotente)
INSERT INTO rol (codigo, nombre, descripcion)
SELECT v.codigo, v.nombre, v.descripcion
FROM (
    VALUES
        ('ADMIN',       'Administrador',      'Acceso total a la información y configuración'),
        ('AUX_BODEGA',  'Auxiliar de bodega', 'Operaciones de inventario y consultas operativas'),
        ('COMPRAS',     'Compras',            'Consulta de stock y registro de abastecimiento'),
        ('GERENCIA',    'Gerencia',           'Consulta de reportes e inventario')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM rol r WHERE r.codigo = v.codigo);

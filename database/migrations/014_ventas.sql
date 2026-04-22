-- Fase 1 ventas: tablas venta / venta_detalle, tipo SALIDA_POR_VENTA, rol VENTAS.

-- Ampliar tipos de movimiento (nombre típico del CHECK inline en PostgreSQL).
ALTER TABLE movimiento DROP CONSTRAINT IF EXISTS movimiento_tipo_movimiento_check;
ALTER TABLE movimiento ADD CONSTRAINT movimiento_tipo_movimiento_check
    CHECK (tipo_movimiento IN ('ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE', 'SALIDA_POR_VENTA'));

CREATE TABLE IF NOT EXISTS venta (
    id             BIGSERIAL PRIMARY KEY,
    empresa_id     BIGINT        NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    bodega_id      BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    usuario_id     BIGINT        NOT NULL REFERENCES usuario (id) ON DELETE RESTRICT,
    movimiento_id  BIGINT        NOT NULL UNIQUE REFERENCES movimiento (id) ON DELETE RESTRICT,
    fecha_venta    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    total          NUMERIC(14, 2) NOT NULL CHECK (total >= 0),
    estado         VARCHAR(24)   NOT NULL DEFAULT 'CONFIRMADA'
        CHECK (estado IN ('CONFIRMADA')),
    observacion    TEXT,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_venta_empresa_fecha ON venta (empresa_id, fecha_venta DESC);
CREATE INDEX IF NOT EXISTS idx_venta_usuario ON venta (usuario_id);

CREATE TABLE IF NOT EXISTS venta_detalle (
    id                BIGSERIAL PRIMARY KEY,
    venta_id          BIGINT         NOT NULL REFERENCES venta (id) ON DELETE RESTRICT,
    producto_id       BIGINT         NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    cantidad          NUMERIC(14, 4) NOT NULL CHECK (cantidad > 0),
    precio_unitario   NUMERIC(14, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal          NUMERIC(14, 2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_detalle_venta ON venta_detalle (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_detalle_producto ON venta_detalle (producto_id);

INSERT INTO rol (codigo, nombre, descripcion)
SELECT v.codigo, v.nombre, v.descripcion
FROM (
    VALUES
        ('VENTAS', 'RESPONSABLE DE VENTAS', 'Registro de ventas, consulta de stock y trazabilidad de salidas por venta')
) AS v(codigo, nombre, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM rol r WHERE r.codigo = v.codigo);

UPDATE rol SET nombre = 'RESPONSABLE DE VENTAS', descripcion = 'Registro de ventas, consulta de stock y trazabilidad de salidas por venta'
WHERE codigo = 'VENTAS';

-- Solicitudes de pedido a proveedor: inventario → administrador → (si aprueba) correo al proveedor.

CREATE TABLE IF NOT EXISTS pedido_proveedor_mensaje (
    id                         BIGSERIAL PRIMARY KEY,
    empresa_id                 BIGINT        NOT NULL REFERENCES empresa (id) ON DELETE RESTRICT,
    producto_id                BIGINT        NOT NULL REFERENCES producto (id) ON DELETE RESTRICT,
    bodega_id                  BIGINT        NOT NULL REFERENCES bodega (id) ON DELETE RESTRICT,
    proveedor_id               BIGINT        NOT NULL REFERENCES proveedor (id) ON DELETE RESTRICT,
    origen                     VARCHAR(32)   NOT NULL
        CHECK (origen IN ('ALERTA_AUTOMATICA', 'SIMULACION_INVENTARIO')),
    estado                     VARCHAR(20)   NOT NULL
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
    cantidad_sugerida          NUMERIC(14, 4) NOT NULL,
    cantidad_para_proveedor    NUMERIC(14, 4) NOT NULL,
    existencia_snapshot        NUMERIC(14, 4) NOT NULL,
    stock_minimo_snapshot      NUMERIC(14, 4) NOT NULL,
    unidad_medida              VARCHAR(20)   NOT NULL,
    creado_en                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    resuelto_en                TIMESTAMPTZ,
    resuelto_por_usuario_id    BIGINT        REFERENCES usuario (id) ON DELETE SET NULL,
    notas_admin                TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_pedido_mensaje_pendiente_linea
    ON pedido_proveedor_mensaje (empresa_id, producto_id, bodega_id)
    WHERE estado = 'PENDIENTE';

CREATE INDEX IF NOT EXISTS idx_pedido_mensaje_empresa_estado_creado
    ON pedido_proveedor_mensaje (empresa_id, estado, creado_en DESC);

COMMENT ON TABLE pedido_proveedor_mensaje IS 'Bandeja admin: pedido sugerido al proveedor; el correo SMTP solo tras APROBADO.';

-- Alertas de stock bajo: correo al proveedor y configuración por empresa.
-- Ejecutar en bases ya desplegadas (ddl-auto=validate requiere columnas presentes).

ALTER TABLE empresa
    ADD COLUMN IF NOT EXISTS email_notificaciones_inventario VARCHAR(255),
    ADD COLUMN IF NOT EXISTS alertas_pedido_proveedor_activas BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS pedido_proveedor_cantidad_maxima NUMERIC(14, 4);

COMMENT ON COLUMN empresa.email_notificaciones_inventario IS 'Correo de la empresa para copia de alertas de stock (si vacío, se usa email_contacto).';
COMMENT ON COLUMN empresa.pedido_proveedor_cantidad_maxima IS 'Tope máximo de unidades a solicitar por correo en un solo pedido (NULL = sin tope explícito en BD; API aplica default).';

ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS proveedor_preferido_id BIGINT REFERENCES proveedor (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_producto_proveedor_pref ON producto (proveedor_preferido_id);

ALTER TABLE inventario
    ADD COLUMN IF NOT EXISTS ultima_alerta_proveedor_at TIMESTAMPTZ;

COMMENT ON COLUMN inventario.ultima_alerta_proveedor_at IS 'Antispam: último envío de correo de pedido al proveedor para esta celda producto+bodega.';

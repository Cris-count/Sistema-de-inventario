-- POS: ventas con pago Stripe antes de confirmar inventario (movimiento_id opcional hasta cobro verificado).

ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_estado_check;
ALTER TABLE venta ADD CONSTRAINT venta_estado_check
    CHECK (estado IN ('CONFIRMADA', 'ANULADA', 'PENDIENTE_PAGO', 'CANCELADA_SIN_PAGO'));

ALTER TABLE venta ALTER COLUMN movimiento_id DROP NOT NULL;

ALTER TABLE venta ADD COLUMN IF NOT EXISTS pago_estado VARCHAR(24);
ALTER TABLE venta ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255);
ALTER TABLE venta ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE venta ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

COMMENT ON COLUMN venta.pago_estado IS 'STRIPE_PENDING|SUCCEEDED|FAILED|CANCELLED o NULL (venta tradicional sin Stripe POS)';
COMMENT ON COLUMN venta.stripe_checkout_session_id IS 'Sesión Checkout activa o última usada para POS';

CREATE UNIQUE INDEX IF NOT EXISTS uk_venta_stripe_session ON venta (stripe_checkout_session_id)
    WHERE stripe_checkout_session_id IS NOT NULL;

UPDATE venta SET pago_estado = NULL WHERE estado IN ('CONFIRMADA', 'ANULADA') AND pago_estado IS NULL;

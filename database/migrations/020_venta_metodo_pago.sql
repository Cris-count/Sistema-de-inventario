ALTER TABLE venta ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(24);

COMMENT ON COLUMN venta.metodo_pago IS 'EFECTIVO|STRIPE. Medio de pago operativo de la venta POS.';

UPDATE venta
SET metodo_pago = 'STRIPE'
WHERE metodo_pago IS NULL
  AND (
    pago_estado LIKE 'STRIPE_%'
    OR stripe_checkout_session_id IS NOT NULL
    OR stripe_payment_intent_id IS NOT NULL
  );

UPDATE venta
SET metodo_pago = 'EFECTIVO'
WHERE metodo_pago IS NULL
  AND pago_estado IS NULL;

UPDATE venta
SET paid_at = COALESCE(paid_at, fecha_venta)
WHERE metodo_pago = 'EFECTIVO'
  AND estado = 'CONFIRMADA';

ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_metodo_pago_check;
ALTER TABLE venta ADD CONSTRAINT venta_metodo_pago_check
  CHECK (metodo_pago IS NULL OR metodo_pago IN ('EFECTIVO', 'STRIPE'));

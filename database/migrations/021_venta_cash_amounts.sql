ALTER TABLE venta ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(14, 2);
ALTER TABLE venta ADD COLUMN IF NOT EXISTS cambio NUMERIC(14, 2);

COMMENT ON COLUMN venta.monto_recibido IS 'Monto entregado por el cliente en pagos EFECTIVO.';
COMMENT ON COLUMN venta.cambio IS 'Cambio devuelto al cliente en pagos EFECTIVO.';

ALTER TABLE venta DROP CONSTRAINT IF EXISTS venta_cash_amounts_check;
ALTER TABLE venta ADD CONSTRAINT venta_cash_amounts_check
  CHECK (
    (monto_recibido IS NULL AND cambio IS NULL)
    OR (
      metodo_pago = 'EFECTIVO'
      AND monto_recibido >= total
      AND cambio = monto_recibido - total
    )
  );

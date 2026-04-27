-- Pricing comercial por producto: costo de compra y precio de venta.
ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS purchase_cost NUMERIC(14,4) NOT NULL DEFAULT 0;

ALTER TABLE producto
    ADD COLUMN IF NOT EXISTS sale_price NUMERIC(14,4) NOT NULL DEFAULT 0;

ALTER TABLE producto
    DROP CONSTRAINT IF EXISTS chk_producto_purchase_cost;
ALTER TABLE producto
    ADD CONSTRAINT chk_producto_purchase_cost CHECK (purchase_cost >= 0);

ALTER TABLE producto
    DROP CONSTRAINT IF EXISTS chk_producto_sale_price;
ALTER TABLE producto
    ADD CONSTRAINT chk_producto_sale_price CHECK (sale_price >= 0);

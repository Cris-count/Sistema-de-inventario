-- Añade motivo a movimiento (bases ya creadas sin esta columna)
ALTER TABLE movimiento ADD COLUMN IF NOT EXISTS motivo VARCHAR(80);

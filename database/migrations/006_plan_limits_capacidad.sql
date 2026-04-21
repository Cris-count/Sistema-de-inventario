-- Límites por plan (usuarios, bodegas). Los productos se aplican vía PlanEntitlementsRegistry al arrancar el backend.
-- Idempotente: actualiza filas existentes por código.

UPDATE saas_plan
SET max_bodegas = 2,
    max_usuarios = 3
WHERE UPPER(codigo) = 'STARTER';

UPDATE saas_plan
SET max_bodegas = 5,
    max_usuarios = 10
WHERE UPPER(codigo) = 'PROFESIONAL';

UPDATE saas_plan
SET max_bodegas = 10,
    max_usuarios = 25
WHERE UPPER(codigo) = 'EMPRESA';

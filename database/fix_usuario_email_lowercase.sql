-- Normaliza emails a minúsculas para coincidir con login (búsqueda ignore case + entrada en minúsculas).
-- Ejecutar una vez si tenías usuarios con mayúsculas mezcladas y el login fallaba.
-- Si dos filas pasan a ser el mismo email, PostgreSQL fallará: resolver a mano antes.

UPDATE usuario SET email = lower(trim(email)) WHERE email IS NOT NULL;

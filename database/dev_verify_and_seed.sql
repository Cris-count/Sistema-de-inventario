-- =============================================================================
-- Inventario — verificación de esquema, roles y usuarios (PostgreSQL)
-- Coherente con database/schema.sql y entidad Usuario (password_hash, nombre…)
-- =============================================================================
-- Ejecutar con: psql -h localhost -U inventario -d inventario -f dev_verify_and_seed.sql
-- No inserta usuarios con contraseñas: use el backend (DataInitializer) o API admin.
-- =============================================================================

SET client_encoding = 'UTF8';

-- 1. Tablas en public
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Columnas de usuario (el script antiguo erróneamente usaba "password"; la columna es password_hash)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuario'
ORDER BY ordinal_position;

-- 3. Columnas de rol
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'rol'
ORDER BY ordinal_position;

-- 4. Roles actuales
SELECT id, codigo, nombre, descripcion
FROM rol
ORDER BY id;

-- 5. Roles base (requiere UNIQUE en rol.codigo; coincide con schema.sql)
INSERT INTO rol (codigo, nombre, descripcion)
VALUES
  ('ADMIN',       'Administrador',      'Acceso total a la información y configuración'),
  ('AUX_BODEGA',  'Auxiliar de bodega', 'Operaciones de inventario; gestión de productos según API'),
  ('COMPRAS',     'Compras',            'Consulta de stock y registro de abastecimiento'),
  ('GERENCIA',    'Gerencia',           'Consulta de reportes e inventario')
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

-- 6. Usuarios con rol
SELECT u.id, u.email, u.activo, r.codigo AS rol_codigo
FROM usuario u
JOIN rol r ON r.id = u.rol_id
ORDER BY u.id;

-- 7. Usuario admin esperado por semilla
SELECT u.email, u.activo, r.codigo AS rol_codigo
FROM usuario u
JOIN rol r ON r.id = u.rol_id
WHERE u.email = 'admin@inventario.local';

-- 8. NO insertar usuarios aquí con contraseñas inventadas.
--    La tabla usa password_hash (BCrypt), nombre NOT NULL, created_at.
--    Opciones seguras:
--    a) Arrancar el backend: DataInitializer crea usuarios por email si no existen.
--    b) POST /api/v1/usuarios autenticado como ADMIN (contraseña en claro solo en tránsito HTTPS).
--    c) Generar hashes con el mismo PasswordEncoder del proyecto (test o snippet Java) y entonces:
/*
INSERT INTO usuario (email, password_hash, nombre, apellido, rol_id, activo)
VALUES (
  'ejemplo@inventario.local',
  '$2a$10$...BCrypt_real_generado_por_Spring...',
  'Nombre',
  'Apellido',
  (SELECT id FROM rol WHERE codigo = 'ADMIN' LIMIT 1),
  TRUE
);
*/

-- 9. Conteos
SELECT 'rol' AS tabla, COUNT(*)::bigint AS n FROM rol
UNION ALL SELECT 'usuario', COUNT(*) FROM usuario
UNION ALL SELECT 'categoria', COUNT(*) FROM categoria
UNION ALL SELECT 'producto', COUNT(*) FROM producto
UNION ALL SELECT 'bodega', COUNT(*) FROM bodega
UNION ALL SELECT 'proveedor', COUNT(*) FROM proveedor;

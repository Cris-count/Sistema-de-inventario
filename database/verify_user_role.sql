-- Verificación rápida: rol efectivo en BD (alineado con JwtAuthenticationFilter)
-- Uso: psql o cliente SQL; cambiar el email si aplica.

SELECT u.id,
       u.email,
       u.activo,
       r.id   AS rol_id,
       r.codigo AS rol_codigo,
       r.nombre AS rol_nombre
FROM usuario u
JOIN rol r ON r.id = u.rol_id
WHERE u.email = 'admin@inventario.local';

-- Listar códigos de rol válidos en el sistema
-- SELECT id, codigo, nombre FROM rol ORDER BY codigo;

-- Solo si negocio/autorización lo permiten: asignar ADMIN a un usuario concreto
-- UPDATE usuario u
-- SET rol_id = (SELECT id FROM rol WHERE codigo = 'ADMIN' LIMIT 1)
-- WHERE u.email = 'correo@empresa.com';

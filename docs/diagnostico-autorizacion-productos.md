# Runbook: autorización al crear/editar productos

Sistema actual (revisar tras cada cambio de permisos):

- **Backend** `ProductoController`: `POST` / `PUT` / `PATCH` → `hasAnyAuthority('ADMIN','AUX_BODEGA')`.
- **Frontend** `ROLES_GESTION_PRODUCTOS` = `['ADMIN', 'AUX_BODEGA']` (botones y avisos).
- **Filtro JWT**: el rol efectivo sale de **PostgreSQL** (`usuario` + `rol`), no solo del claim del token.

---

## 1. Datos a reunir en un incidente

| Dato | Dónde obtenerlo |
|------|-----------------|
| Rol real en BD | Script `database/verify_user_role.sql` (ajustar email) |
| Código HTTP | DevTools → Network → `POST`/`PUT` `/api/v1/productos` |
| Cuerpo de error | Misma petición → Response (Problem Details: `title`, `detail`, `status`) |
| Token / sesión | Application → Local Storage → `inventario_token`, `inventario_user`; decodificar payload JWT (parte central del JWS) → `sub` = email |

---

## 2. Tabla de decisión (una sola fila suele bastar)

| Rol en BD | POST/PUT productos ¿permitido por diseño? | HTTP típico si “falla” | Conclusión |
|-----------|------------------------------------------|-------------------------|------------|
| `COMPRAS` | No | 403 | Correcto por negocio; no es bug de JWT |
| `GERENCIA` | No | 403 | Idem |
| `ADMIN` | Sí | 403 | Incidente técnico (token, BD, despliegue, email distinto) |
| `AUX_BODEGA` | Sí | 403 | Idem |
| `ADMIN` o `AUX_BODEGA` | Sí | 401 | Token / `Authorization` / `JWT_SECRET` / URL API |
| `ADMIN` o `AUX_BODEGA` | Sí | 400 | Validación (categoría, código duplicado, campos) |
| `ADMIN` o `AUX_BODEGA` | Sí | 500 | Revisar logs del backend |

---

## 3. Escenarios detallados

### A – Usuario `COMPRAS` en BD

- **Por qué:** No está en `ADMIN` ni `AUX_BODEGA`; el rechazo en escritura es **esperado**.
- **Corrección de producto:** ninguna si el modelo de negocio es correcto.
- **Si el negocio exige que Compras cree productos:** ampliar `@PreAuthorize` en `ProductoController`, constante en `app-roles.ts` y menú; no solo SQL.

### B – Usuario `GERENCIA` en BD

- Igual que A: rol de **consulta**; 403 en escritura es coherente.

### C – `ADMIN` o `AUX_BODEGA` en BD pero respuesta **403**

1. Confirmar que el **email del JWT** (`sub`) coincide con la fila corregida en BD.
2. Cerrar sesión, borrar `inventario_token` e `inventario_user` si hace falta, volver a entrar.
3. Confirmar que el request va a la misma API que el backend desplegado (`environment.apiUrl`).
4. Verificar que el JAR/contenedor incluye `ProductoController` actual (no artefacto viejo).

### D – `ADMIN` o `AUX_BODEGA` pero **401**

1. Header `Authorization: Bearer <jwt>` presente en Network.
2. Nuevo login; comprobar expiración del token.
3. Mismo `JWT_SECRET` entre quien firmó el token y el proceso actual (Docker `.env`, `application.yml`).
4. Misma base URL que Swagger si pruebas allí.

### E – **400**

- Leer `detail` / errores de validación.
- Payload mínimo válido (ejemplo): `codigo`, `nombre`, `categoriaId` existente, etc.
- Comprobar unicidad de `codigo` en tabla `producto`.

### F – **500**

- Logs del contenedor o consola Spring; revisar FK a `categoria`, integridad BD.

---

## 4. SQL útil (también en `database/verify_user_role.sql`)

Ver rol por email:

```sql
SELECT u.email, u.activo, r.codigo AS rol_codigo
FROM usuario u
JOIN rol r ON r.id = u.rol_id
WHERE u.email = 'admin@inventario.local';
```

Asignar rol ADMIN (solo si negocio y seguridad lo permiten):

```sql
UPDATE usuario u
SET rol_id = (SELECT id FROM rol WHERE codigo = 'ADMIN' LIMIT 1)
WHERE u.email = 'correo@empresa.com';
```

Tras `UPDATE` de rol: **cerrar sesión e iniciar sesión** de nuevo.

---

## 5. Verificación final

1. `SELECT` muestra `rol_codigo` esperado (`ADMIN` o `AUX_BODEGA` para gestión).
2. `POST /api/v1/productos` devuelve **201** con cuerpo del producto creado.
3. Sidebar muestra el mismo `rolCodigo` que la BD tras login (`GET /auth/me`).

---

## 6. Prevención

- Tras cambiar `rol_id` en BD: siempre **relogin**.
- Mantener `JWT_SECRET` estable por entorno; documentar URL del API.
- Desplegar backend + frontend alineados a los commits que cambian `@PreAuthorize` y `ROLES_GESTION_PRODUCTOS`.

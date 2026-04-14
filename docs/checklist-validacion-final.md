# Checklist — validación final (demo)

Usar con API en `http://localhost:8080` y front en `http://localhost:4200` (o el entorno configurado).

## Entorno

- [ ] `docker compose up -d --build` (o API y PostgreSQL corriendo).
- [ ] `npm start` en la raíz del repo (Angular).
- [ ] Usuarios semilla disponibles (ver `application.yml` / login).

## Autenticación

- [ ] Login con cada rol (ADMIN, AUX_BODEGA, COMPRAS, GERENCIA).
- [ ] `GET /api/v1/auth/me` devuelve `rolCodigo` coherente con la BD.
- [ ] Sin token: respuesta 401 en rutas protegidas.
- [ ] Token inválido: 401 con mensaje de JWT.

## Por rol (resumen)

| Rol        | Debe poder                         | No debe poder (ejemplo)        |
|------------|-------------------------------------|--------------------------------|
| ADMIN      | Usuarios, maestros, stock inicial, movimientos, reportes | — (alcance total API)          |
| AUX_BODEGA | Productos (crear/editar), movimientos operativos | `GET /usuarios` → 403          |
| COMPRAS    | Ver productos, registrar entrada    | Crear producto, salida/transf./ajuste → 403 |
| GERENCIA   | Inventario y reportes (lectura)     | POST producto, POST entrada → 403 |

## Productos e inventario

- [ ] Listado paginado de productos (GET) con JWT válido → 200.
- [ ] Creación de producto (ADMIN/AUX) → 201.
- [ ] Consulta de inventario por bodega y alertas según rol.

## Movimientos

- [ ] Entrada (motivo COMPRA con proveedor si aplica).
- [ ] Salida con stock suficiente → 200.
- [ ] Salida con stock insuficiente → 409 (conflicto de negocio).
- [ ] Transferencia entre bodegas distintas.
- [ ] Ajuste (solo origen o solo destino por línea).
- [ ] Historial de movimientos y kardex por producto.

## Reportes

- [ ] Kardex por `productoId` y rango de fechas.
- [ ] Export CSV de movimientos.

## Automatización API

- [ ] `npm run test:api` (Newman) — 42 aserciones en la colección v3 PASO 8.

## Frontend (smoke)

- [ ] Navegación acorde al rol (menú / guards).
- [ ] Tras 401/403, mensaje o redirección razonable (no silencio total).
- [ ] `environment.apiUrl` apunta al mismo host que la API probada.

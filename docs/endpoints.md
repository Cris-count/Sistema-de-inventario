# API REST — Endpoints previstos (v1)

Base URL: `https://{host}/api/v1`  
Autenticación: `Authorization: Bearer {accessToken}` (salvo login).

Convenciones de error: `400` validación, `401` no autenticado, `403` prohibido, `404` no encontrado, `409` conflicto de negocio (p. ej. stock insuficiente).

---

## Auth

| Método | Ruta | Descripción | Request body | Response | Roles |
|--------|------|-------------|--------------|----------|-------|
| POST | `/auth/login` | Obtener tokens | `{ "email", "password" }` | `{ "accessToken", "tokenType", "expiresIn", "user": { id, email, nombre, rol } }` | Público |
| POST | `/auth/logout` | Invalidar sesión (opcional) | vacío o refresh | 204 | Autenticado |
| GET | `/auth/me` | Perfil actual | — | Usuario + rol | Autenticado |

---

## Usuarios (RF-02)

| Método | Ruta | Descripción | Request | Response | Roles |
|--------|------|-------------|---------|----------|-------|
| GET | `/usuarios` | Listado paginado | query: page, size, activo | Page\<UsuarioDTO\> | ADMIN |
| GET | `/usuarios/{id}` | Detalle | — | UsuarioDTO | ADMIN |
| POST | `/usuarios` | Crear | `{ email, password, nombre, apellido?, rolCodigo }` | 201 + id | ADMIN |
| PUT | `/usuarios/{id}` | Actualizar datos/rol | parcial | UsuarioDTO | ADMIN |
| PATCH | `/usuarios/{id}/estado` | Activar/desactivar | `{ "activo": boolean }` | UsuarioDTO | ADMIN |

---

## Catálogo: categorías y productos (RF-03, RF-04)

| Método | Ruta | Descripción | Request | Response | Roles |
|--------|------|-------------|---------|----------|-------|
| GET | `/categorias` | Listar | filtros activo | Lista | ADMIN, AUX, COMPRAS, GER (lectura) |
| POST | `/categorias` | Crear | `{ nombre, descripcion? }` | 201 | ADMIN |
| PUT | `/categorias/{id}` | Editar | — | CategoriaDTO | ADMIN |
| GET | `/productos` | Listar paginado | q, categoriaId, activo | Page | Todos autenticados (lectura según política) |
| GET | `/productos/{id}` | Detalle | — | ProductoDTO | Autenticados |
| POST | `/productos` | Crear | `{ codigo, nombre, categoriaId, unidadMedida?, stockMinimo? }` | 201 | ADMIN |
| PUT | `/productos/{id}` | Editar | — | ProductoDTO | ADMIN |
| PATCH | `/productos/{id}/estado` | Activo/inactivo | `{ activo }` | ProductoDTO | ADMIN |

---

## Bodegas y proveedores (RF-05, RF-06)

| Método | Ruta | Descripción | Request | Response | Roles |
|--------|------|-------------|---------|----------|-------|
| GET | `/bodegas` | Listar | activo | Lista | Autenticados |
| POST | `/bodegas` | Crear | `{ codigo, nombre, direccion? }` | 201 | ADMIN |
| PUT | `/bodegas/{id}` | Editar | — | BodegaDTO | ADMIN |
| GET | `/proveedores` | Listar | activo | Lista | ADMIN, COMPRAS, GER |
| POST | `/proveedores` | Crear | `{ documento, razonSocial, ... }` | 201 | ADMIN |
| PUT | `/proveedores/{id}` | Editar | — | ProveedorDTO | ADMIN |

---

## Inventario y stock inicial (RF-07, RF-11, RF-12)

| Método | Ruta | Descripción | Request | Response | Roles |
|--------|------|-------------|---------|----------|-------|
| GET | `/inventario` | Existencias | `productoId?, bodegaId?, page, size` | filas producto+bodega+cantidad | AUX, COMPRAS, GER, ADMIN |
| POST | `/inventario/stock-inicial` | Carga inicial | `{ lineas: [ { productoId, bodegaId, cantidad, referencia? } ] }` | resumen movimiento | ADMIN (o AUX si política) |
| GET | `/inventario/alertas` | Bajo mínimo | `bodegaId?` | lista alertas | AUX, COMPRAS, GER, ADMIN |

---

## Movimientos (RF-08, RF-09, RF-10, RF-14)

Unificar en recursos por tipo **o** un solo `POST` con discriminador; aquí se listan rutas explícitas (más claras para permisos).

| Método | Ruta | Descripción | Request | Response | Roles |
|--------|------|-------------|---------|----------|-------|
| POST | `/movimientos/entradas` | Entrada(s) | `{ motivo, proveedorId?, referenciaDocumento?, observacion?, lineas: [ { productoId, bodegaDestinoId, cantidad } ] }` | movimiento + ids | AUX, COMPRAS, ADMIN |
| POST | `/movimientos/salidas` | Salida(s) | `{ motivo, referenciaDocumento?, lineas: [ { productoId, bodegaOrigenId, cantidad } ] }` | movimiento | AUX, ADMIN |
| POST | `/movimientos/transferencias` | Transferencia | `{ referenciaDocumento?, lineas: [ { productoId, bodegaOrigenId, bodegaDestinoId, cantidad } ] }` | movimiento | AUX, ADMIN |
| POST | `/movimientos/ajustes` | Ajuste / conteo (RF-14) | `{ motivo, lineas: [...] }` según política de ajuste | movimiento | AUX, ADMIN |
| GET | `/movimientos/{id}` | Detalle cabecera + líneas | — | MovimientoDTO | según rol lectura |
| GET | `/movimientos` | Historial paginado | fechas, tipo, productoId, bodegaId | Page | GER, ADMIN, AUX, COMPRAS |

---

## Reportes y exportación (RF-13, RF-16)

| Método | Ruta | Descripción | Query | Response | Roles |
|--------|------|-------------|-------|----------|-------|
| GET | `/reportes/kardex` | Movimientos por producto | productoId, desde, hasta | lista | GER, ADMIN, AUX, COMPRAS |
| GET | `/reportes/movimientos` | Listado filtrable | parámetros | Page | GER, ADMIN, AUX, COMPRAS |
| GET | `/reportes/movimientos/export` | CSV | mismos filtros | archivo | GER, ADMIN, AUX, COMPRAS |

---

## Auditoría (RF-15, opcional)

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/auditoria/eventos` | Eventos de seguridad (si existen) | ADMIN |

---

## Salud

| GET | `/actuator/health` | Spring Boot Actuator | Público / interno |

---

### Matriz RF → endpoints (cobertura)

| RF | Endpoints principales |
|----|------------------------|
| RF-01 | POST `/auth/login`, GET `/auth/me` |
| RF-02 | CRUD `/usuarios` |
| RF-03 | `/categorias` |
| RF-04 | `/productos` |
| RF-05 | `/bodegas` |
| RF-06 | `/proveedores` |
| RF-07 | POST `/inventario/stock-inicial` |
| RF-08 | POST `/movimientos/entradas` |
| RF-09 | POST `/movimientos/salidas` |
| RF-10 | POST `/movimientos/transferencias` |
| RF-11 | GET `/inventario` |
| RF-12 | GET `/inventario/alertas` |
| RF-13 | GET `/reportes/*` |
| RF-14 | POST `/movimientos/ajustes` |
| RF-15 | GET `/auditoria/eventos` (opcional) |
| RF-16 | GET `.../export` |

---

## Validación crítica de endpoints

| Pregunta | Conclusión |
|----------|------------|
| ¿Todo RF tiene cobertura? | Sí, salvo RF-15 opcional (auditoría de seguridad sin tabla dedicada). |
| ¿Endpoints innecesarios? | No se añadieron recursos duplicados; `/actuator/health` es estándar y opcional. |
| ¿Falta alguno clave? | No para el flujo MVP: maestros + stock inicial + tres movimientos + consultas + reportes + export. |
| ¿Se puede completar el negocio solo con API? | Sí: primero maestros y stock inicial, luego entradas/salidas/transferencias, consultas y reportes. |
| ¿Entradas/salidas/transferencias sin problemas? | Sí, si el backend valida líneas según `tipo_movimiento` y actualiza `inventario` en transacción única. |

**Corrección aplicada:** rutas separadas por tipo de movimiento evitan un único POST genérico difícil de autorizar por rol y de documentar en Swagger.

# API REST — Contrato real (`/api/v1`)

**Base URL (desarrollo):** `http://localhost:8080/api/v1`  
**Autenticación:** cabecera `Authorization: Bearer <accessToken>` en todos los recursos salvo login.  
**Errores:** cuerpo tipo **Problem Details** (RFC 7807): `title`, `status`, `detail`.

Convenciones HTTP habituales: `400` validación, `401` no autenticado, `403` prohibido, `404` no encontrado, `409` conflicto de negocio (p. ej. stock).

---

## Auth

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| POST | `/auth/login` | Público | Login; cuerpo JSON con `email` y `password` (trim; email en minúsculas en servidor). |
| GET | `/auth/me` | Autenticado | Perfil actual (`UserSummary`: id, email, nombre, rolCodigo, rolNombre). |

**POST `/auth/login` — request**

```json
{ "email": "admin@inventario.local", "password": "Admin123!" }
```

**Response 200**

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "id": 1,
    "email": "admin@inventario.local",
    "nombre": "Administrador",
    "rolCodigo": "ADMIN",
    "rolNombre": "Administrador"
  }
}
```

**Errores:** `401` credenciales inválidas (Problem Details).

---

## Usuarios

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/usuarios` | ADMIN |
| GET | `/usuarios/{id}` | ADMIN |
| POST | `/usuarios` | ADMIN |
| PUT | `/usuarios/{id}` | ADMIN |
| PATCH | `/usuarios/{id}/estado` | ADMIN |

**POST** cuerpo: `email`, `password`, `nombre`, `apellido?`, `rolCodigo`. El email se normaliza a minúsculas al guardar.  
**PATCH** cuerpo: `{ "activo": boolean }`.

---

## Categorías

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/categorias` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| POST | `/categorias` | ADMIN |
| PUT | `/categorias/{id}` | ADMIN |

**POST/PUT** cuerpo: `{ "nombre": "...", "descripcion": "..." }`

---

## Productos

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/productos` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| GET | `/productos/{id}` | Idem |
| POST | `/productos` | **ADMIN, AUX_BODEGA** |
| PUT | `/productos/{id}` | **ADMIN, AUX_BODEGA** |
| PATCH | `/productos/{id}/estado` | **ADMIN, AUX_BODEGA** |

**POST/PUT** cuerpo: `codigo`, `nombre`, `descripcion?`, `categoriaId`, `unidadMedida?`, `stockMinimo?` (numérico).  
**PATCH** cuerpo: `{ "activo": true }`.

**Nota:** COMPRAS y GERENCIA reciben **403** en POST/PUT/PATCH.

---

## Bodegas

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/bodegas` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| POST | `/bodegas` | ADMIN |
| PUT | `/bodegas/{id}` | ADMIN |

**POST/PUT** cuerpo: `codigo`, `nombre`, `direccion?`.

---

## Proveedores

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/proveedores` | **ADMIN, COMPRAS, GERENCIA** (AUX_BODEGA **no**) |
| POST | `/proveedores` | ADMIN |
| PUT | `/proveedores/{id}` | ADMIN |

**POST/PUT** cuerpo: `documento`, `razonSocial`, `contacto?`, `telefono?`, `email?`.

---

## Inventario

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/inventario` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| GET | `/inventario/alertas` | Idem |
| GET | `/inventario/panel-abastecimiento` | Idem | Panel «productos por reponer»: mismas líneas que alertas + proveedor sugerido, última entrada por bodega, KPIs y flag `puedeRegistrarEntrada` (plan `movimientos_basicos` + rol con entrada). Query opcional: `bodegaId`. |
| POST | `/inventario/stock-inicial` | **ADMIN** |

**GET `/inventario`** — query opcionales: `productoId`, `bodegaId`, `page`, `size`.  
**GET `/alertas`** — query opcional: `bodegaId`.  
**POST `/stock-inicial`** — cuerpo: `{ "lineas": [ { "productoId", "bodegaId", "cantidad", "referencia?" } ] }`.

---

## Movimientos

| Método | Ruta | Roles |
|--------|------|-------|
| POST | `/movimientos/entradas` | ADMIN, AUX_BODEGA, **COMPRAS** |
| POST | `/movimientos/salidas` | ADMIN, AUX_BODEGA |
| POST | `/movimientos/transferencias` | ADMIN, AUX_BODEGA |
| POST | `/movimientos/ajustes` | ADMIN, AUX_BODEGA |
| GET | `/movimientos/{id}` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| GET | `/movimientos` | Idem |

**GET `/movimientos`** — query obligatorios: `desde`, `hasta` (fecha `YYYY-MM-DD`); opcional: `tipo` (enum), `page`, `size`.

Cuerpos de alta: ver `MovimientoDtos` en el código (`EntradaRequest`, `SalidaRequest`, etc.): líneas con `productoId`, bodegas y `cantidad` > 0.

---

## Reportes

| Método | Ruta | Roles |
|--------|------|-------|
| GET | `/reportes/kardex` | ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| GET | `/reportes/movimientos/export` | Idem (CSV) |

**GET `/reportes/kardex`** — query: `productoId`, `desde`, `hasta`, paginación.  
**GET `/reportes/movimientos/export`** — query: `desde`, `hasta` → descarga CSV.

---

## Salud

| GET | `/actuator/health` | Público |

---

## No implementado en esta versión

- `POST /auth/logout` (el cliente solo borra token).
- Listado paginado de movimientos bajo `/reportes/...` (el listado está en `GET /movimientos`).

---

## Referencia viva

La **fuente de verdad** son los controladores en `backend/src/main/java/com/inventario/web/controller/` y **Swagger UI**: `http://localhost:8080/swagger-ui.html` con el API en ejecución.

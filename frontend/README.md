# Frontend — Sistema de inventario (PASO 6)

## Objetivo

Aplicación **Angular21** (standalone components) que consume el **API monolítico modular** Spring Boot (`/api/v1`), con **JWT** en cabecera `Authorization: Bearer`, formularios reactivos para movimientos y maestros, **guards** por autenticación y rol, e **interceptor** HTTP para adjuntar el token y manejar `401`.

El código fuente del frontend está en la **raíz del monorepo** (`src/`, `angular.json`, `package.json`), no dentro de esta carpeta `frontend/` (esta carpeta documenta y referencia el proyecto).

## Tecnologías

- Angular 21, RxJS, `HttpClient` con functional interceptors
- Estilos: `src/styles.css`, `src/landing-styles.css` y **Tailwind CSS v4** (`@tailwindcss/postcss` en el build)
- Build: `outputMode: static` (SPA sin SSR) para simplificar sesión JWT y `localStorage`

## Estructura de carpetas (`src/app/`)

| Ruta | Propósito |
|------|-----------|
| `core/auth/` | `AuthService`, `authGuard`, `guestGuard`, `roleGuard` |
| `core/interceptors/` | `authInterceptor` (Bearer + redirección en401) |
| `core/api/` | Servicios HTTP alineados a controladores Spring |
| `core/models/` | Tipos de DTO/página (`Page<T>`, entidades de lectura) |
| `core/util/` | `api-error` (RFC 7807 `detail`), fechas |
| `core/navigation.ts` | Ítems del menú y visibilidad por rol |
| `shared/shell/` | Layout con sidebar y `router-outlet` |
| `features/auth/` | Login |
| `features/dashboard/` | Panel simple con conteos |
| `features/productos/`, `categorias/`, `bodegas/`, `proveedores/` | Maestros |
| `features/inventario/` | Consulta, alertas, stock inicial (admin) |
| `features/movimientos/` | Historial, detalle, entrada, salida, transferencia, ajuste |
| `features/reportes/` | Kardex, export CSV |
| `features/usuarios/` | ABM usuarios (admin) |

## Instalación

Desde la raíz del repositorio:

```bash
npm install
```

## Variables de entorno

La URL del API se define en `src/environments/environment.ts`:

- `apiUrl`: por defecto `http://localhost:8080/api/v1`

Ajustar si el backend corre en otro host/puerto (p. ej. Docker publicando otro puerto).

## Cómo ejecutar

Desde la **raíz del monorepo** (donde está `package.json` y `angular.json`):

```bash
npm install
npm start
```

Arranque conjunto con base de datos Docker + API local (ver README raíz):

```bash
npm run up
```

(`npm run frontend` y `npm run dev` son equivalentes a `npm start`.)

Navegador: http://localhost:4200 — la home pública es la **landing** (`/`). El panel autenticado es `/app`.

El backend debe exponer CORS para `http://localhost:4200` (ya configurado en `SecurityConfig` del API).

## Conexión con el backend

1. Levantar API + PostgreSQL (`docker compose up -d --build` desde la raíz del monorepo).
2. Verificar `apiUrl` en `environment.ts`.
3. Iniciar sesión con un usuario existente (p. ej. semilla `admin@inventario.local` / `Admin123!` si aplica).

**Logout:** el cliente solo borra token y usuario de `localStorage`. El backend **no** implementa `POST /auth/logout` en esta versión.

## Pantallas disponibles

- Login, panel (dashboard), productos, categorías (admin), bodegas, proveedores (ADMIN/COMPRAS/GERENCIA)
- Inventario (filtros + alertas), stock inicial (admin)
- Movimientos: historial, detalle, entrada, salida, transferencia, ajuste (según rol del API)
- Reportes: kardex, descarga CSV de movimientos
- Usuarios (admin)

Los menús y rutas con `roleGuard` reflejan las autoridades del backend (`ADMIN`, `AUX_BODEGA`, `COMPRAS`, `GERENCIA`); la seguridad real sigue siendo **solo en el servidor**.

## Plan de pruebas funcionales (manual)

1. Login correcto → redirección a `/app`, token guardado.
2. Login incorrecto → mensaje `Credenciales inválidas` (401).
3. Recarga con token válido → sesión restaurada desde `localStorage`.
4. Usuario sin rol para una ruta → redirección a `/app` (403 en API si se llama directamente).
5. CRUD visual de producto (admin) y lectura para otros roles.
6. Registrar entrada con líneas válidas; ver inventario actualizado.
7. Registrar salida; probar **stock insuficiente** → mensaje de negocio (409).
8. Transferencia con origen ≠ destino; error de validación si son iguales.
9. Consultar inventario y alertas.
10. Kardex por producto y export CSV en rango de fechas.
11. Errores de validación backend (400) muestran `detail` del ProblemDetail.

## Coherencia con el API real

- Implementado según controladores en `backend/.../controller` (no se asume `GET /reportes/movimientos` ni `POST /auth/logout` que aparecían como opcionales/plan en documentación pero no en código).
- Entrada: auxiliares sin permiso de listar proveedores usan campo opcional numérico `proveedorId` manual.

## Compilación producción

```bash
npm run build
```

Salida: `dist/Inventario/browser/`.

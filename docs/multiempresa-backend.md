# Multi-empresa (multi-tenant) — backend

## Regla crítica (lectura obligatoria)

**Nunca usar `findById(id)`** (ni `getOne`) sobre entidades que tienen `empresa_id` (producto, categoría, bodega, proveedor, usuario, movimiento, etc.) en código de aplicación. Eso puede devolver datos de **otra empresa** si se conoce el id numérico.

- **Correcto**: `findByIdAndEmpresaId`, consultas con `empresa.id = :empresaId`, o **`TenantEntityLoader`** / servicios en **`com.inventario.service.catalog`**.
- **Excepciones**: `Inventario` con clave compuesta (no tiene `empresa_id` propio; el aislamiento viene de joins a producto); **`getReferenceById`** solo **después** de validar producto/bodega en el tenant (p. ej. stock en `MovimientoService`); **bootstrap** (`DataInitializer`); **seguridad** (carga de usuario por email).

La convención está documentada en Javadoc: `com.inventario.domain.repository.package-info`.

## Modelo

- Cada **usuario** pertenece a una **empresa** (`usuario.empresa_id`).
- Los maestros operativos (**categoría, producto, bodega, proveedor, movimiento**) llevan `empresa_id`.
- El catálogo de **roles** es global; el aislamiento es por **empresa del usuario**, no por rol duplicado por tenant.

## Capa de aplicación (blindaje frente a errores humanos)

Los controladores HTTP **no** inyectan repositorios JPA de entidades con tenant. Delegan en:

| Servicio | Responsabilidad |
|----------|-----------------|
| `ProductoCatalogService` | CRUD productos + listado por spec |
| `CategoriaCatalogService` | CRUD categorías |
| `BodegaCatalogService` | CRUD bodegas |
| `ProveedorCatalogService` | CRUD proveedores |
| `UsuarioManagementService` | Usuarios del tenant |
| `EmpresaProfileService` | GET/PUT `/empresa/mi` |
| `InventarioQueryService` | Consultas de existencias |
| `MovimientoConsultaService` | Historial y kardex |
| `MovimientoService` | Registro transaccional de movimientos y stock |

`TenantEntityLoader` y `TenantIntegrityService` concentran carga por tenant e invariantes.

## Cómo se valida el tenant

1. **API**: `empresaId` vía `CurrentUserService.requireEmpresaId()` (empresa **ACTIVA**).
2. **Lecturas/escrituras por id**: métodos `…AndEmpresaId` o JPQL con `empresa.id`. Sin fila → **404** aunque el id exista en otro tenant.
3. **`TenantIntegrityService`**: producto/categoría, líneas vs cabecera de movimiento, proveedor vs movimiento.
4. **`TenantEntityLoader`**: 404 / 409 unificados al resolver entidades operativas.

## Política 404 vs 403

| Situación | HTTP |
|-----------|------|
| Recurso inexistente o **pertenece a otra empresa** | **404** |
| Usuario sin rol (`@PreAuthorize`) | **403** |
| Sin empresa, empresa inactiva, reglas de negocio (p. ej. `SUPER_ADMIN`) | **403** |
| Conflicto de negocio (código duplicado, stock, invariante multi-empresa) | **409** |

## JWT y claim `empresaId`

- Si el token incluye `empresaId`, debe coincidir con la empresa del usuario en BD; si no → **401**.
- Tokens sin el claim siguen siendo aceptados. La fuente de verdad es la BD en cada request.

## Especificaciones JPA

`TenantSpecifications.belongsToEmpresa(empresaId)` para listados (p. ej. productos paginados).

## Empresa del usuario autenticado

- `GET /api/v1/empresa/mi` — lectura.
- `PUT /api/v1/empresa/mi` — nombre, email y teléfono (validación de formato en DTO); **no** cambia `identificacion`. Persiste `updated_at` y `updated_by` (usuario autenticado). Migración: `database/migrations/003_empresa_updated_by.sql`.

## Transaccionalidad (movimientos)

Las operaciones de registro en `MovimientoService` usan `@Transactional(rollbackFor = Exception.class)`: validación de línea, detalle y stock es **atómica**.

## Pruebas

- `TenantIntegrityServiceTest`, `TenantJwtClaimsValidatorTest`.
- `MultiTenantIsolationIT` — verifica aislamiento a nivel repositorio (uso deliberado de `ProductoRepository` solo en test, no en controladores).

## Integración futura (otro desarrollador)

Planes, PIN, pagos y límites pueden anclarse a `empresa` sin romper el contrato anterior: seguir la regla de no `findById` sin tenant y extender servicios de catálogo o nuevos servicios de dominio, no los controladores con repositorios.

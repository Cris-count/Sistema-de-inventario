# Roles y permisos (alineado con `rol.codigo` en BD)

Los roles **no** son microservicios; son **autorización** (`@PreAuthorize` + filtro JWT que relee el rol desde la base de datos).

| Rol | Código en BD | Descripción general |
|-----|----------------|---------------------|
| Administrador | `ADMIN` | Usuarios, maestros críticos, stock inicial, toda lectura. |
| Auxiliar bodega | `AUX_BODEGA` | Catálogo de productos (alta/edición), movimientos operativos, consultas. |
| Compras | `COMPRAS` | Entradas de mercancía, consultas y proveedores (lectura); **no** edita catálogo de productos ni salidas/transferencias/ajustes. |
| Gerencia | `GERENCIA` | **Solo consulta** maestros permitidos, inventario, reportes, historial; sin escrituras operativas. |

---

## Matriz resumida por área

| Área | ADMIN | AUX_BODEGA | COMPRAS | GERENCIA |
|------|-------|------------|---------|----------|
| Usuarios | CRUD | — | — | — |
| Categorías POST/PUT | ✓ | — | — | — |
| Categorías GET | ✓ | ✓ | ✓ | ✓ |
| Productos GET | ✓ | ✓ | ✓ | ✓ |
| Productos POST/PUT/PATCH estado | ✓ | ✓ | — | — |
| Bodegas GET | ✓ | ✓ | ✓ | ✓ |
| Bodegas POST/PUT | ✓ | — | — | — |
| Proveedores GET | ✓ | — | ✓ | ✓ |
| Proveedores POST/PUT | ✓ | — | — | — |
| Inventario / alertas GET | ✓ | ✓ | ✓ | ✓ |
| Stock inicial POST | ✓ | — | — | — |
| Entrada POST | ✓ | ✓ | ✓ | — |
| Salida / transferencia / ajuste POST | ✓ | ✓ | — | — |
| Movimientos GET (historial/detalle) | ✓ | ✓ | ✓ | ✓ |
| Reportes kardex / export | ✓ | ✓ | ✓ | ✓ |

---

## HTTP esperado si el rol no alcanza

**403** con `detail` coherente (Problem Details). El frontend oculta acciones según rol; la API **siempre** valida de nuevo.

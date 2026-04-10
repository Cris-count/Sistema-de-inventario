# Modelo de datos (PostgreSQL) — resumen

## Objetivo

Persistir maestros (roles, usuarios, categorías, productos, bodegas, proveedores), **saldos** por `(producto, bodega)` y el **historial** en `movimiento` + `movimiento_detalle`.

## Entidades y relaciones principales

```
rol 1───N usuario
categoria 1───N producto
producto N───M bodega  →  inventario (cantidad)  [tabla de asociación con atributo]
usuario 1───N movimiento [opcional: proveedor en cabecera]
movimiento 1───N movimiento_detalle ─── producto
movimiento_detalle ─── bodega (origen y/o destino según tipo)
```

## Tablas

| Tabla | PK | Notas |
|-------|-----|--------|
| `rol` | `id` | Semilla: ADMIN, AUX_BODEGA, COMPRAS, GERENCIA |
| `usuario` | `id` | FK `rol_id`; email UNIQUE |
| `categoria` | `id` | nombre UNIQUE |
| `producto` | `id` | codigo UNIQUE; FK `categoria_id`; `stock_minimo` |
| `bodega` | `id` | codigo UNIQUE |
| `proveedor` | `id` | documento UNIQUE |
| `inventario` | `(producto_id, bodega_id)` | cantidad ≥ 0 |
| `movimiento` | `id` | tipo ENTRADA/SALIDA/TRANSFERENCIA/AJUSTE; `motivo`; FK usuario; FK proveedor opcional |
| `movimiento_detalle` | `id` | FK movimiento, producto; bodegas según tipo |

## Stock (decisión de diseño)

- **Fuente operativa:** tabla `inventario` actualizada en la **misma transacción** que el detalle del movimiento.
- **Historial:** `movimiento` + `movimiento_detalle` para kardex y reportes.

## Script fuente

- `database/schema.sql` — esquema completo.
- `database/migrations/001_add_movimiento_motivo.sql` — bases ya desplegadas sin columna `motivo`.

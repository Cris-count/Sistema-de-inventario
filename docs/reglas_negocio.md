# Reglas de negocio consolidadas

## Globales

1. Solo **Administrador** tiene acceso total a información y configuración crítica.
2. **Autenticación obligatoria** para operaciones distintas de login/salud.
3. **Usuario inactivo** no puede autenticarse ni operar.
4. **Entidades maestras inactivas** (producto, bodega, proveedor) no participan en **nuevos** movimientos.
5. **Trazabilidad:** todo movimiento queda asociado a `usuario_id` y marca temporal; cabecera incluye `motivo` cuando el RF lo exige.

## Catálogo

6. **Código de producto único** entre productos activos (en BD: UNIQUE en `codigo`).
7. **Categoría y bodega** con identificadores únicos donde aplique (nombre/código UNIQUE).
8. **Proveedor:** documento único.

## Inventario y movimientos

9. **Stock no negativo** en `inventario.cantidad` (CHECK ≥ 0).
10. **Salida estándar:** cantidad solicitada ≤ stock disponible en bodega origen (validación en servicio).
11. **Transferencia:** `bodega_origen ≠ bodega_destino`; ambas activas; stock suficiente en origen.
12. **Entrada por compra:** `proveedor_id` obligatorio en cabecera cuando el motivo/tipo sea compra (validación aplicación).
13. **Ajuste por conteo:** puede generar entrada o salida de ajuste; reglas específicas en servicio (no forzar regla de venta estándar sobre ajuste).

## Reportes y exportación

14. **Gerencia:** solo lectura en endpoints de consulta/reporte.
15. **Exportación CSV:** mismos permisos que el reporte origen; límites de rango/fechas para evitar abusos.

## Auditoría

16. **Borrado físico** de movimientos no recomendado; preferir estado `ANULADO` con reversión controlada en servicio.
17. **RF-15 (eventos de seguridad):** si no hay tabla dedicada, mínimo **logs de aplicación** o extensión futura sin bloquear el MVP.

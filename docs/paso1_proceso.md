# Paso 1 — Resumen del modelo de proceso (inventario)

## Propósito del sistema

Controlar productos y existencias en una o varias bodegas mediante registro de **entradas**, **salidas** y **transferencias**, con **trazabilidad**, **roles** y **reportes**.

## Flujo operativo (orden lógico)

1. **Configuración:** el Administrador crea usuarios, bodegas, categorías y productos.
2. **Línea base:** se registra stock inicial por producto y bodega.
3. **Operación:** entradas (compra, ajuste positivo), salidas (venta, daño, pérdida, consumo), transferencias entre bodegas.
4. **Consistencia:** el sistema mantiene saldos actualizados y movimientos auditados (usuario, fecha).
5. **Control:** alertas por stock mínimo; consultas y reportes para Compras, operación y Gerencia (solo lectura).

## Roles y gobierno

| Rol | Alcance |
|-----|---------|
| Administrador | Acceso total a información y configuración. |
| Auxiliar de bodega | Movimientos y consultas operativas. |
| Compras | Consulta stock y registro de abastecimiento (entradas). |
| Gerencia | Solo lectura: inventario y reportes. |

## Resultado esperado del proceso

Un inventario **trazable** (quién, cuándo, qué), con **stock coherente** con los movimientos y **decisiones** basadas en datos actualizados.

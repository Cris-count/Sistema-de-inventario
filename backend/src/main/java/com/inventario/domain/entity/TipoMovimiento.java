package com.inventario.domain.entity;

public enum TipoMovimiento {
    ENTRADA,
    SALIDA,
    /** Salida de stock originada en una venta confirmada (trazabilidad distinta a salida manual). */
    SALIDA_POR_VENTA,
    TRANSFERENCIA,
    AJUSTE
}

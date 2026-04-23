package com.inventario.domain.entity;

public enum VentaEstado {
    CONFIRMADA,
    /** Venta anulada administrativamente; stock revertido y movimiento asociado ANULADO. */
    ANULADA
}

package com.inventario.domain.entity;

public enum VentaEstado {
    CONFIRMADA,
    /** Solicitud registrada; requiere revisión/aprobación administrativa antes de revertir stock. */
    ANULACION_SOLICITADA,
    /** Venta anulada administrativamente; stock revertido y movimiento asociado ANULADO. */
    ANULADA,
    /** Carrito registrado; esperando confirmación de pago Stripe antes de descontar stock. */
    PENDIENTE_PAGO,
    /** Abandonada antes de cobrar; sin movimiento de inventario. */
    CANCELADA_SIN_PAGO
}

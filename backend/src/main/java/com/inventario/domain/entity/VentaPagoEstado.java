package com.inventario.domain.entity;

/** Ciclo de pago Stripe en ventas POS (null en filas legacy sin tarjeta). */
public enum VentaPagoEstado {
    STRIPE_PENDING,
    STRIPE_SUCCEEDED,
    STRIPE_FAILED,
    STRIPE_CANCELLED
}

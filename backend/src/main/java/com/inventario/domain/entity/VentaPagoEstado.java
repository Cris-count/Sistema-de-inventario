package com.inventario.domain.entity;

/** Ciclo de pago Stripe en ventas POS; el medio se modela en {@link VentaMetodoPago}. */
public enum VentaPagoEstado {
    STRIPE_PENDING,
    STRIPE_SUCCEEDED,
    STRIPE_FAILED,
    STRIPE_CANCELLED
}

package com.inventario.service.saas;

/**
 * Estado inconsistente de suscripción/plan en BD (no es límite ni módulo del plan comercial).
 * Prefijo {@code SUB_} para que el cliente no trate estos casos como upgrade de plan.
 */
public final class SubscriptionStateBlockCodes {

    public static final String SUSCRIPCION_NO_ENCONTRADA = "SUB_SUSCRIPCION_NO_ENCONTRADA";
    public static final String PLAN_NO_ASIGNADO_EN_SUSCRIPCION = "SUB_PLAN_NO_ASIGNADO";

    private SubscriptionStateBlockCodes() {}
}

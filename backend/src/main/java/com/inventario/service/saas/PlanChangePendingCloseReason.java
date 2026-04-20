package com.inventario.service.saas;

/**
 * Valor de {@link com.inventario.domain.entity.SaasPago#getConfirmationChannel()} cuando un cambio de plan
 * pendiente se cierra sin confirmar pago. Debe coincidir con lo que escribe {@code SubscriptionPlanChangeService}.
 */
public final class PlanChangePendingCloseReason {

    public static final String EXPIRADO_SISTEMA = "EXPIRADO_SISTEMA";
    public static final String CANCELADO_USUARIO = "CANCELADO_USUARIO";
    public static final String PENDIENTE_SIN_PAGO = "PENDIENTE_SIN_PAGO";

    /**
     * Valor de {@link com.inventario.domain.entity.SaasPago#getProveedor()} en pagos creados por
     * {@code SubscriptionPlanChangeService#solicitarCambio} (upgrade con pago pendiente).
     */
    public static final String SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN = "CAMBIO_PLAN";

    private PlanChangePendingCloseReason() {}
}

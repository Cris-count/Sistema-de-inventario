package com.inventario.service.saas;

/**
 * Códigos de bloqueo por plan expuestos en {@code ProblemDetail} ({@code blockCode}) para UX en cliente.
 */
public final class PlanBlockCodes {

    public static final String MODULO_NO_INCLUIDO = "PLAN_MODULO_NO_INCLUIDO";
    public static final String REPORTES_NO_INCLUIDO = "PLAN_REPORTES_NO_INCLUIDO";
    public static final String LIMITE_BODEGAS = "PLAN_LIMITE_BODEGAS";
    public static final String LIMITE_USUARIOS = "PLAN_LIMITE_USUARIOS";
    public static final String LIMITE_PRODUCTOS = "PLAN_LIMITE_PRODUCTOS";
    public static final String DOWNGRADE_EXCESO_BODEGAS = "PLAN_DOWNGRADE_EXCESO_BODEGAS";
    public static final String DOWNGRADE_EXCESO_USUARIOS = "PLAN_DOWNGRADE_EXCESO_USUARIOS";
    public static final String DOWNGRADE_EXCESO_PRODUCTOS = "PLAN_DOWNGRADE_EXCESO_PRODUCTOS";
    public static final String CAMBIO_PENDIENTE_PAGO = "PLAN_CAMBIO_PENDIENTE_PAGO";
    public static final String CAMBIO_SUSCRIPCION_NO_PERMITIDA = "PLAN_CAMBIO_SUSCRIPCION_NO_PERMITIDA";

    private PlanBlockCodes() {}
}

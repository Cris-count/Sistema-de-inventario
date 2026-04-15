package com.inventario.service.saas;

/**
 * Códigos de bloqueo por rol o contexto de tenant (no confundir con límites/módulos de plan).
 * Expuestos en {@code ProblemDetail} como {@code blockCode}. No usar prefijo {@code PLAN_}.
 */
public final class AuthBlockCodes {

    public static final String ROL_ASIGNACION_NO_PERMITIDA = "ROL_ASIGNACION_NO_PERMITIDA";
    public static final String TENANT_SIN_EMPRESA = "TENANT_SIN_EMPRESA";
    public static final String TENANT_EMPRESA_NO_OPERATIVA = "TENANT_EMPRESA_NO_OPERATIVA";

    private AuthBlockCodes() {}
}

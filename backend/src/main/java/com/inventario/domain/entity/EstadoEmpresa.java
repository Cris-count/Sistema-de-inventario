package com.inventario.domain.entity;

public enum EstadoEmpresa {
    /** Operación comercial al día (post-pago o política interna). */
    ACTIVA,
    /** Suspendida o dada de baja. */
    INACTIVA,
    /** Onboarding en periodo de prueba: acceso al panel habilitado. */
    EN_PRUEBA,
    /** Alta completada; pendiente de pago o activación comercial (sin acceso al panel). */
    COMERCIAL_PENDIENTE;

    public boolean permiteAccesoUsuarios() {
        return this == ACTIVA || this == EN_PRUEBA;
    }
}

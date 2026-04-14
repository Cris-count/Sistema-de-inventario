package com.inventario.service.onboarding;

public enum OnboardingActivationPolicy {
    /** Periodo de prueba con acceso al panel. */
    TRIAL,
    /** Alta lista; el usuario queda deshabilitado hasta confirmar pago o activación manual. */
    PENDING_PAYMENT,
    /** Empresa operativa sin paso de pago (p. ej. venta cerrada offline). */
    ACTIVE
}

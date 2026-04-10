package com.inventario.config;

/**
 * Debe coincidir con {@code rol.codigo} en base de datos.
 */
public final class SecurityRoles {
    public static final String ADMIN = "ADMIN";
    public static final String AUX_BODEGA = "AUX_BODEGA";
    public static final String COMPRAS = "COMPRAS";
    public static final String GERENCIA = "GERENCIA";

    private SecurityRoles() {}
}

package com.inventario.config;

import java.util.Locale;

/**
 * Debe coincidir con {@code rol.codigo} en base de datos.
 * <p>
 * Las autoridades de Spring Security y los claims expuestos al cliente usan
 * {@link #canonicalCodigo(String)} para que coincida con {@code @PreAuthorize} aunque en BD
 * hubiera variaciones de mayúsculas o espacios.
 */
public final class SecurityRoles {
    /** Administrador principal de la empresa (multi-tenant); mismos permisos operativos que {@link #ADMIN} en la API actual. */
    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ADMIN = "ADMIN";
    public static final String AUX_BODEGA = "AUX_BODEGA";
    public static final String COMPRAS = "COMPRAS";
    public static final String GERENCIA = "GERENCIA";

    private SecurityRoles() {}

    /** {@code trim} + mayúsculas ({@link Locale#ROOT}); cadena vacía si no hay código usable. */
    public static String canonicalCodigo(String codigo) {
        if (codigo == null) {
            return "";
        }
        String s = codigo.trim();
        return s.isEmpty() ? "" : s.toUpperCase(Locale.ROOT);
    }
}

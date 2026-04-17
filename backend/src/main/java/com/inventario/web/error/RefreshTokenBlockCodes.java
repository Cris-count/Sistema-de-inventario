package com.inventario.web.error;

/**
 * Códigos estables para errores de refresh / sesión (Problem Details {@code blockCode}).
 */
public final class RefreshTokenBlockCodes {

    public static final String REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID";
    public static final String REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED";
    public static final String REFRESH_TOKEN_REVOKED = "REFRESH_TOKEN_REVOKED";
    public static final String REFRESH_TOKEN_REUSED = "REFRESH_TOKEN_REUSED";
    /** Tope absoluto de la familia alcanzado (no confundir con expiración del token opaco individual). */
    public static final String REFRESH_FAMILY_EXPIRED = "REFRESH_FAMILY_EXPIRED";

    private RefreshTokenBlockCodes() {}
}

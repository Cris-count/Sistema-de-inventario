package com.inventario.service.mfa;

/**
 * Códigos estables para errores MFA (Problem Details {@code blockCode}).
 */
public final class MfaBlockCodes {

    public static final String MFA_REQUIRED = "MFA_REQUIRED";
    public static final String MFA_INVALID_CODE = "MFA_INVALID_CODE";
    public static final String MFA_EXPIRED_TOKEN = "MFA_EXPIRED_TOKEN";
    public static final String MFA_NOT_ENABLED = "MFA_NOT_ENABLED";
    public static final String MFA_TOO_MANY_ATTEMPTS = "MFA_TOO_MANY_ATTEMPTS";
    public static final String MFA_CHALLENGE_REUSED = "MFA_CHALLENGE_REUSED";
    public static final String MFA_ALREADY_ENABLED = "MFA_ALREADY_ENABLED";
    public static final String MFA_SETUP_REQUIRED = "MFA_SETUP_REQUIRED";

    private MfaBlockCodes() {}
}

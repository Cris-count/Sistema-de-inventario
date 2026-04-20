package com.inventario.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Auditoría de autenticación (sin secretos, códigos ni tokens completos).
 */
@Component
public class AuthAuditLogger {

    private static final Logger LOG = LoggerFactory.getLogger("AUTH_AUDIT");

    /** Emisión de JWT de acceso tras login directo (cuenta sin MFA). */
    public void accessTokenIssuedAfterPasswordOnly(Long userId, Long empresaId) {
        LOG.info("access_token_issued userId={} empresaId={} afterMfaSecondStep=false", userId, empresaId);
    }

    /** Emisión de JWT tras completar el segundo factor (TOTP o código de respaldo). */
    public void accessTokenIssuedAfterMfa(Long userId, Long empresaId) {
        LOG.info("access_token_issued userId={} empresaId={} afterMfaSecondStep=true", userId, empresaId);
    }

    /** Contraseña válida; respuesta lleva challenge MFA (aún no hay JWT de acceso). */
    public void mfaChallengeIssued(Long userId) {
        LOG.info("mfa_required userId={}", userId);
    }

    public void mfaVerifyFailed(Long userId, String blockCode, String jtiPrefix) {
        LOG.warn("mfa_verify_failed userId={} blockCode={} jtiPrefix={}", userId, blockCode, jtiPrefix);
    }

    public void mfaBackupCodeUsed(Long userId) {
        LOG.info("mfa_backup_code_used userId={}", userId);
    }

    public void refreshTokenRotated(Long userId, Long empresaId) {
        LOG.info("refresh_token_rotated userId={} empresaId={}", userId, empresaId);
    }

    public void refreshTokenReuseDetected(Long userId, String familyId) {
        LOG.warn("refresh_token_reuse_detected userId={} familyIdPrefix={}", userId, familyIdPrefix(familyId));
    }

    public void refreshLogout(Long userId, String familyId) {
        LOG.info("refresh_logout userId={} familyIdPrefix={}", userId, familyIdPrefix(familyId));
    }

    public void refreshLogoutUnknownTokenPrefix(String hashPrefix) {
        LOG.info("refresh_logout_unknown hashPrefix={}", hashPrefix);
    }

    public void refreshFamilyExpired(Long userId, String familyId) {
        LOG.info("refresh_family_expired userId={} familyIdPrefix={}", userId, familyIdPrefix(familyId));
    }

    public void refreshFamilyRevokedForSessionCap(Long userId, String familyId) {
        LOG.info("refresh_family_revoked_session_cap userId={} familyIdPrefix={}", userId, familyIdPrefix(familyId));
    }

    public void authEndpointRateLimited(String endpoint, String bucketType) {
        LOG.warn("auth_rate_limited endpoint={} bucketType={}", endpoint, bucketType);
    }

    public void refreshPepperMissingOnStartup() {
        LOG.error("refresh_pepper_missing_startup pepperRequired=true sin REFRESH_TOKEN_PEPPER");
    }

    private static String familyIdPrefix(String familyId) {
        if (familyId == null || familyId.length() < 8) {
            return "short";
        }
        return familyId.substring(0, 8);
    }
}

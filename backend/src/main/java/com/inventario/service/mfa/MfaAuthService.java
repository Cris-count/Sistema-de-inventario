package com.inventario.service.mfa;

import com.inventario.audit.AuthAuditLogger;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.security.JwtService;
import com.inventario.service.security.AuthTokenPairIssuer;
import com.inventario.web.dto.TokenResponse;
import com.inventario.web.dto.auth.MfaVerifyRequest;
import com.inventario.web.error.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Segundo paso de login: canje de challenge MFA por JWT de acceso (TOTP o código de respaldo).
 */
@Service
@RequiredArgsConstructor
public class MfaAuthService {

    private static final String TOTP_PATTERN = "^\\d{6}$";
    private static final String BACKUP_PATTERN = "^[A-Fa-f0-9]{8}$";

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final MfaChallengeStateStore challengeStateStore;
    private final MfaTotpService totpService;
    private final MfaBackupCodeService mfaBackupCodeService;
    private final AuthTokenPairIssuer authTokenPairIssuer;
    private final AuthAuditLogger authAuditLogger;

    @Transactional
    public TokenResponse verify(MfaVerifyRequest req, HttpServletRequest httpRequest) {
        Claims claims = parseChallengeClaims(req.challengeToken());
        String jti = claims.getId();
        String email = claims.getSubject();
        if (email == null || email.isBlank()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Token de verificación inválido.", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }

        challengeStateStore.assertChallengeUsable(jti, email);

        Usuario u = usuarioRepository.findByEmailIgnoreCase(email.trim()).orElseThrow(
                () -> new BusinessException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas", MfaBlockCodes.MFA_EXPIRED_TOKEN));

        assertAccountOperationalForAccess(u);
        assertMfaConfigured(u);

        String code = req.code().trim();

        if (code.matches(TOTP_PATTERN) && totpService.verify(u.getMfaSecret(), code)) {
            return completeMfaSuccess(jti, email, httpRequest);
        }

        if (code.matches(BACKUP_PATTERN) && mfaBackupCodeService.verifyAndConsume(u.getId(), code)) {
            authAuditLogger.mfaBackupCodeUsed(u.getId());
            return completeMfaSuccess(jti, email, httpRequest);
        }

        challengeStateStore.registerInvalidTotp(jti, email);
        authAuditLogger.mfaVerifyFailed(u.getId(), MfaBlockCodes.MFA_INVALID_CODE, jtiPrefix(jti));
        throw new BusinessException(HttpStatus.UNAUTHORIZED, "Código de verificación incorrecto.", MfaBlockCodes.MFA_INVALID_CODE);
    }

    private TokenResponse completeMfaSuccess(String jti, String email, HttpServletRequest httpRequest) {
        challengeStateStore.consumeSuccessfully(jti, email);

        Usuario refreshed = usuarioRepository.findByEmailIgnoreCase(email.trim()).orElseThrow(
                () -> new BusinessException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas", MfaBlockCodes.MFA_EXPIRED_TOKEN));
        assertAccountOperationalForAccess(refreshed);
        assertMfaConfigured(refreshed);

        TokenResponse token = authTokenPairIssuer.issueForUser(refreshed, httpRequest);
        authAuditLogger.accessTokenIssuedAfterMfa(refreshed.getId(), refreshed.getEmpresa().getId());
        return token;
    }

    private static String jtiPrefix(String jti) {
        if (jti == null || jti.length() < 8) {
            return "short";
        }
        return jti.substring(0, 8);
    }

    private static void assertAccountOperationalForAccess(Usuario u) {
        if (!Boolean.TRUE.equals(u.getActivo())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
        if (u.getEmpresa() == null || !u.getEmpresa().getEstado().permiteAccesoUsuarios()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas", MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
    }

    private static void assertMfaConfigured(Usuario u) {
        if (!u.isMfaEnabled()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "El segundo factor no está activado para esta cuenta.",
                    MfaBlockCodes.MFA_NOT_ENABLED);
        }
        if (u.getMfaSecret() == null || u.getMfaSecret().isBlank()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Configuración MFA incompleta. Completa el alta en tu perfil.",
                    MfaBlockCodes.MFA_SETUP_REQUIRED);
        }
    }

    private Claims parseChallengeClaims(String token) {
        try {
            Claims claims = jwtService.parse(token);
            jwtService.assertIssuerAndAudience(claims);
            try {
                jwtService.assertMfaChallengeShape(claims);
            } catch (IllegalArgumentException e) {
                throw new BusinessException(
                        HttpStatus.UNAUTHORIZED,
                        "Token de verificación inválido.",
                        MfaBlockCodes.MFA_EXPIRED_TOKEN);
            }
            return claims;
        } catch (ExpiredJwtException e) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED,
                    "El desafío MFA expiró. Inicia sesión de nuevo.",
                    MfaBlockCodes.MFA_EXPIRED_TOKEN);
        } catch (JwtException | IllegalArgumentException e) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED,
                    "Token de verificación inválido o expirado.",
                    MfaBlockCodes.MFA_EXPIRED_TOKEN);
        }
    }
}

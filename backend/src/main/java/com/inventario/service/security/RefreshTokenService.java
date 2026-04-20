package com.inventario.service.security;

import com.inventario.audit.AuthAuditLogger;
import com.inventario.config.RefreshTokenProperties;
import com.inventario.domain.entity.RefreshToken;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RefreshTokenRepository;
import com.inventario.ratelimit.ClientIpResolver;
import com.inventario.web.dto.TokenResponse;
import com.inventario.web.error.BusinessException;
import com.inventario.web.error.RefreshTokenBlockCodes;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Tokens opacos rotados en cada uso; familia ({@code familyId}) invalidada ante reutilización de un token ya rotado.
 * Política de expiración: ver {@link RefreshTokenProperties}.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int OPAQUE_BYTES = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenHasher refreshTokenHasher;
    private final RefreshTokenProperties refreshTokenProperties;
    private final AccessTokenIssuer accessTokenIssuer;
    private final ClientIpResolver clientIpResolver;
    private final AuthAuditLogger authAuditLogger;

    public record IssuedRefresh(String plainToken, long refreshExpiresInSeconds) {}

    @Transactional
    public IssuedRefresh createFreshFamily(Usuario usuario, HttpServletRequest request) {
        enforceFamilyCapIfConfigured(usuario);
        String familyId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant familyExpiresAt = now.plusMillis(refreshTokenProperties.getFamilyAbsoluteTtlMs());
        return saveNewRefresh(usuario, familyId, familyExpiresAt, request);
    }

    @Transactional
    public TokenResponse refresh(String plainRefresh, HttpServletRequest request) {
        if (plainRefresh == null || plainRefresh.isBlank()) {
            throw refreshInvalid();
        }
        String hash = refreshTokenHasher.hashOpaqueToken(plainRefresh.trim());
        RefreshToken row =
                refreshTokenRepository.findByTokenHashForUpdate(hash).orElseThrow(RefreshTokenService::refreshInvalid);

        Instant now = Instant.now();

        if (row.getFamilyExpiresAt().isBefore(now)) {
            authAuditLogger.refreshFamilyExpired(row.getUsuario().getId(), row.getFamilyId());
            throw refreshFamilyExpired();
        }

        if (row.getRevokedAt() != null) {
            if (row.getReplacedByToken() != null) {
                refreshTokenRepository.revokeAllInFamily(row.getFamilyId(), now);
                authAuditLogger.refreshTokenReuseDetected(row.getUsuario().getId(), row.getFamilyId());
                throw refreshReused();
            }
            throw refreshRevoked();
        }

        if (row.getExpiresAt().isBefore(now)) {
            throw refreshExpired();
        }

        Usuario u = row.getUsuario();
        assertAccountOperationalForRefresh(u);

        Instant familyExpiresAt = row.getFamilyExpiresAt();
        Instant newTokenExpiresAt = computeTokenExpiresAt(now, familyExpiresAt, refreshTokenProperties.getExpirationMs());

        String newPlain = generateOpaque();
        RefreshToken newRow =
                RefreshToken.builder()
                        .usuario(u)
                        .tokenHash(refreshTokenHasher.hashOpaqueToken(newPlain))
                        .familyId(row.getFamilyId())
                        .issuedAt(now)
                        .expiresAt(newTokenExpiresAt)
                        .familyExpiresAt(familyExpiresAt)
                        .createdFromIp(resolveIp(request))
                        .userAgent(trimUa(request))
                        .build();
        refreshTokenRepository.save(newRow);
        refreshTokenRepository.flush();

        row.setLastUsedAt(now);
        row.setRevokedAt(now);
        row.setReplacedByToken(newRow);
        refreshTokenRepository.save(row);

        TokenResponse access = accessTokenIssuer.issueForUser(u);
        authAuditLogger.refreshTokenRotated(u.getId(), u.getEmpresa() != null ? u.getEmpresa().getId() : null);
        long refreshSec = Math.max(1L, Duration.between(now, newTokenExpiresAt).getSeconds());
        return new TokenResponse(
                access.accessToken(),
                access.tokenType(),
                access.expiresIn(),
                access.user(),
                newPlain,
                refreshSec);
    }

    @Transactional
    public void logout(String plainRefresh, HttpServletRequest request) {
        if (plainRefresh == null || plainRefresh.isBlank()) {
            return;
        }
        String hash = refreshTokenHasher.hashOpaqueToken(plainRefresh.trim());
        RefreshToken row = refreshTokenRepository.findByTokenHashForUpdate(hash).orElse(null);
        if (row == null) {
            authAuditLogger.refreshLogoutUnknownTokenPrefix(hashPrefix(hash));
            return;
        }
        Instant now = Instant.now();
        refreshTokenRepository.revokeAllInFamily(row.getFamilyId(), now);
        authAuditLogger.refreshLogout(row.getUsuario().getId(), row.getFamilyId());
    }

    /**
     * Tope de familias activas: revoca la(s) más antigua(s) hasta dejar &lt; max antes de crear una nueva.
     * Extensión futura: sustituir por bean de política si se requiere administración fina.
     */
    private void enforceFamilyCapIfConfigured(Usuario usuario) {
        int max = refreshTokenProperties.getMaxActiveFamiliesPerUser();
        if (max <= 0) {
            return;
        }
        Instant now = Instant.now();
        while (true) {
            List<String> active = refreshTokenRepository.findActiveFamilyIdsOldestFirst(usuario.getId(), now);
            if (active.size() < max) {
                return;
            }
            String oldest = active.get(0);
            refreshTokenRepository.revokeAllInFamily(oldest, now);
            authAuditLogger.refreshFamilyRevokedForSessionCap(usuario.getId(), oldest);
        }
    }

    private IssuedRefresh saveNewRefresh(
            Usuario usuario, String familyId, Instant familyExpiresAt, HttpServletRequest request) {
        Instant now = Instant.now();
        Instant tokenExpiresAt = computeTokenExpiresAt(now, familyExpiresAt, refreshTokenProperties.getExpirationMs());
        String plain = generateOpaque();
        RefreshToken entity =
                RefreshToken.builder()
                        .usuario(usuario)
                        .tokenHash(refreshTokenHasher.hashOpaqueToken(plain))
                        .familyId(familyId)
                        .issuedAt(now)
                        .expiresAt(tokenExpiresAt)
                        .familyExpiresAt(familyExpiresAt)
                        .createdFromIp(resolveIp(request))
                        .userAgent(trimUa(request))
                        .build();
        refreshTokenRepository.save(entity);
        long sec = Math.max(1L, Duration.between(now, tokenExpiresAt).getSeconds());
        return new IssuedRefresh(plain, sec);
    }

    /** Límite duro de la familia vs ventana de rotación del token opaco. */
    static Instant computeTokenExpiresAt(Instant now, Instant familyExpiresAt, long rotationTtlMs) {
        Instant rotationEnd = now.plusMillis(rotationTtlMs);
        return rotationEnd.isBefore(familyExpiresAt) ? rotationEnd : familyExpiresAt;
    }

    private static String generateOpaque() {
        byte[] b = new byte[OPAQUE_BYTES];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private String resolveIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return clientIpResolver.resolve(request);
    }

    private static String trimUa(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String ua = request.getHeader("User-Agent");
        if (ua == null) {
            return null;
        }
        ua = ua.trim();
        return ua.length() > 512 ? ua.substring(0, 512) : ua;
    }

    private static void assertAccountOperationalForRefresh(Usuario u) {
        if (!Boolean.TRUE.equals(u.getActivo())) {
            throw refreshInvalid();
        }
        if (u.getEmpresa() == null || !u.getEmpresa().getEstado().permiteAccesoUsuarios()) {
            throw refreshInvalid();
        }
    }

    private static BusinessException refreshInvalid() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED, "Sesión de renovación inválida.", RefreshTokenBlockCodes.REFRESH_TOKEN_INVALID);
    }

    private static BusinessException refreshExpired() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED, "La sesión de renovación expiró.", RefreshTokenBlockCodes.REFRESH_TOKEN_EXPIRED);
    }

    private static BusinessException refreshFamilyExpired() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED,
                "La sesión alcanzó el límite de tiempo permitido. Inicia sesión de nuevo.",
                RefreshTokenBlockCodes.REFRESH_FAMILY_EXPIRED);
    }

    private static BusinessException refreshRevoked() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED, "La sesión fue cerrada.", RefreshTokenBlockCodes.REFRESH_TOKEN_REVOKED);
    }

    private static BusinessException refreshReused() {
        return new BusinessException(
                HttpStatus.UNAUTHORIZED,
                "Se detectó reutilización de un token de renovación. Vuelve a iniciar sesión.",
                RefreshTokenBlockCodes.REFRESH_TOKEN_REUSED);
    }

    private static String hashPrefix(String hexHash) {
        if (hexHash == null || hexHash.length() < 8) {
            return "short";
        }
        return hexHash.substring(0, 8);
    }
}

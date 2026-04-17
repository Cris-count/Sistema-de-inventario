package com.inventario.ratelimit;

import com.inventario.audit.AuthAuditLogger;
import com.inventario.web.error.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.OptionalInt;

/**
 * Punto único de políticas de rate limiting para rutas públicas sensibles.
 */
@Service
@RequiredArgsConstructor
public class ApplicationRateLimitService {

    private final RateLimitProperties properties;
    private final RateLimitBackend backend;
    private final ClientIpResolver clientIpResolver;
    private final AuthAuditLogger authAuditLogger;

    public void assertLoginAllowed(HttpServletRequest request, String normalizedEmail) {
        if (!properties.isEnabled()) {
            return;
        }
        var p = properties.getLogin();
        String ip = clientIpResolver.resolve(request);
        assertBucket("login-ip", ip, p.getMaxPerIpPerWindow(), p.getWindowSeconds(), null, null);
        String fp = RateLimitKeyHasher.emailFingerprint(normalizedEmail, properties.getHashPepper());
        assertBucket("login-email", fp, p.getMaxPerEmailPerWindow(), p.getWindowSeconds(), null, null);
    }

    public void assertMfaVerifyAllowed(HttpServletRequest request, String challengeToken) {
        if (!properties.isEnabled()) {
            return;
        }
        var p = properties.getMfaVerify();
        String ip = clientIpResolver.resolve(request);
        assertBucket("mfa-ip", ip, p.getMaxPerIpPerWindow(), p.getWindowSeconds(), null, null);
        String ch = RateLimitKeyHasher.challengeFingerprint(challengeToken, properties.getHashPepper());
        assertBucket("mfa-challenge", ch, p.getMaxPerChallengePerWindow(), p.getWindowSeconds(), null, null);
    }

    public void assertOnboardingRegisterAllowed(HttpServletRequest request, String superAdminEmailRaw) {
        if (!properties.isEnabled()) {
            return;
        }
        var p = properties.getOnboarding();
        String ip = clientIpResolver.resolve(request);
        assertBucket("onboarding-ip", ip, p.getMaxPerIpPerWindow(), p.getWindowSeconds(), null, null);
        String email =
                superAdminEmailRaw == null
                        ? ""
                        : superAdminEmailRaw.trim().toLowerCase(Locale.ROOT);
        String fp = RateLimitKeyHasher.emailFingerprint(email, properties.getHashPepper());
        assertBucket("onboarding-email", fp, p.getMaxPerEmailPerWindow(), p.getWindowSeconds(), null, null);
    }

    public void assertBillingPostAllowed(HttpServletRequest request) {
        if (!properties.isEnabled()) {
            return;
        }
        var b = properties.getBilling();
        if (!b.isIpLimited()) {
            return;
        }
        String ip = clientIpResolver.resolve(request);
        assertBucket("billing-ip", ip, b.getMaxPerIpPerWindow(), b.getWindowSeconds(), null, null);
    }

    public void assertRefreshAllowed(HttpServletRequest request, String refreshPlain) {
        if (!properties.isEnabled()) {
            return;
        }
        var p = properties.getAuthRefresh();
        String ip = clientIpResolver.resolve(request);
        assertBucket(
                "refresh-ip",
                ip,
                p.getMaxPerIpPerWindow(),
                p.getWindowSeconds(),
                "refresh",
                "ip");
        if (refreshPlain != null && !refreshPlain.isBlank()) {
            String fp = RateLimitKeyHasher.refreshTokenFingerprint(refreshPlain, properties.getHashPepper());
            assertBucket(
                    "refresh-token-fp",
                    fp,
                    p.getMaxPerTokenFingerprintPerWindow(),
                    p.getWindowSeconds(),
                    "refresh",
                    "token_fp");
        }
    }

    public void assertLogoutAllowed(HttpServletRequest request, String refreshPlain) {
        if (!properties.isEnabled()) {
            return;
        }
        var p = properties.getAuthLogout();
        String ip = clientIpResolver.resolve(request);
        assertBucket(
                "logout-ip",
                ip,
                p.getMaxPerIpPerWindow(),
                p.getWindowSeconds(),
                "logout",
                "ip");
        if (refreshPlain != null && !refreshPlain.isBlank()) {
            String fp = RateLimitKeyHasher.refreshTokenFingerprint(refreshPlain, properties.getHashPepper());
            assertBucket(
                    "logout-token-fp",
                    fp,
                    p.getMaxPerTokenFingerprintPerWindow(),
                    p.getWindowSeconds(),
                    "logout",
                    "token_fp");
        }
    }

    private void assertBucket(
            String namespace,
            String bucketKey,
            int maxRequests,
            int windowSeconds,
            String auditEndpoint,
            String auditBucketType) {
        OptionalInt retry = backend.recordAndGetRetryAfterSeconds(namespace, bucketKey, maxRequests, windowSeconds);
        if (retry.isPresent()) {
            if (auditEndpoint != null && auditBucketType != null) {
                authAuditLogger.authEndpointRateLimited(auditEndpoint, auditBucketType);
            }
            throw new BusinessException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Demasiadas solicitudes. Inténtelo de nuevo más tarde.",
                    RateLimitBlockCodes.RATE_LIMIT_EXCEEDED,
                    retry.getAsInt());
        }
    }
}

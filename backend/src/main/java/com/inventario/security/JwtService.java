package com.inventario.security;

import com.inventario.config.SecurityRoles;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

/**
 * JWT firmado (HS256). Construcción, firma y parseo; validación de {@code iss}/{@code aud} explícita tras {@link #parse(String)}.
 */
@Service
public class JwtService {

    public static final String TOKEN_USE_CLAIM = "token_use";
    public static final String TOKEN_USE_ACCESS = "ACCESS";
    public static final String TOKEN_USE_MFA_CHALLENGE = "MFA_CHALLENGE";

    private static final long MFA_CHALLENGE_MAX_MS = 300_000L;

    private final SecretKey key;
    private final long expirationMs;
    private final long mfaChallengeExpirationMs;
    private final String expectedIssuer;
    private final String expectedAudience;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            @Value("${app.jwt.mfa-challenge-expiration-ms:300000}") long mfaChallengeExpirationMs,
            @Value("${app.jwt.issuer}") String issuer,
            @Value("${app.jwt.audience}") String audience) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT_SECRET no está definido o está vacío. Defina la variable de entorno JWT_SECRET "
                            + "(app.jwt.secret), mínimo 32 bytes UTF-8 para HS256.");
        }
        if (issuer == null || issuer.isBlank() || audience == null || audience.isBlank()) {
            throw new IllegalStateException("app.jwt.issuer y app.jwt.audience son obligatorios y no pueden estar vacíos.");
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET debe tener al menos 32 bytes (256 bits) para HS256");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
        this.mfaChallengeExpirationMs = Math.min(Math.max(60_000L, mfaChallengeExpirationMs), MFA_CHALLENGE_MAX_MS);
        this.expectedIssuer = issuer.trim();
        this.expectedAudience = audience.trim();
    }

    public String getExpectedIssuer() {
        return expectedIssuer;
    }

    public String getExpectedAudience() {
        return expectedAudience;
    }

    /**
     * JWT de acceso estándar. {@code empresaId} es obligatorio (multiempresa y validación en filtro).
     */
    public String generateToken(String email, Long userId, String rolCodigo, Long empresaId, String empresaNombre) {
        if (empresaId == null) {
            throw new IllegalArgumentException("empresaId es obligatorio en el JWT de acceso");
        }
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);
        String rol = SecurityRoles.canonicalCodigo(rolCodigo);
        if (rol.isEmpty()) {
            throw new IllegalArgumentException("rolCodigo no puede estar vacío en el JWT");
        }
        var b = Jwts.builder()
                .issuer(expectedIssuer)
                .claim(Claims.AUDIENCE, expectedAudience)
                .subject(email)
                .claim(TOKEN_USE_CLAIM, TOKEN_USE_ACCESS)
                .claim("uid", userId)
                .claim("rol", rol)
                .claim("empresaId", empresaId)
                .issuedAt(now)
                .expiration(exp);
        if (empresaNombre != null && !empresaNombre.isBlank()) {
            b.claim("empresaNombre", empresaNombre);
        }
        return b.signWith(key).compact();
    }

    /**
     * JWT de un solo uso lógico (controlado por {@link com.inventario.service.mfa.MfaChallengeStateStore})
     * para completar MFA; no válido como token de acceso.
     */
    public String generateMfaChallengeToken(String email) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + mfaChallengeExpirationMs);
        String jti = UUID.randomUUID().toString();
        return Jwts.builder()
                .issuer(expectedIssuer)
                .claim(Claims.AUDIENCE, expectedAudience)
                .id(jti)
                .subject(email)
                .claim(TOKEN_USE_CLAIM, TOKEN_USE_MFA_CHALLENGE)
                .issuedAt(now)
                .expiration(exp)
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Valida emisor y audiencia esperados (acceso y challenge).
     */
    public void assertIssuerAndAudience(Claims claims) {
        String iss = claims.getIssuer();
        if (iss == null || !expectedIssuer.equals(iss)) {
            throw new IllegalArgumentException("JWT iss inválido");
        }
        Set<String> aud = claims.getAudience();
        if (aud == null || aud.isEmpty() || !aud.contains(expectedAudience)) {
            throw new IllegalArgumentException("JWT aud inválido");
        }
    }

    public boolean isMfaChallengeToken(Claims claims) {
        return TOKEN_USE_MFA_CHALLENGE.equals(claims.get(TOKEN_USE_CLAIM, String.class));
    }

    public boolean isAccessToken(Claims claims) {
        return TOKEN_USE_ACCESS.equals(claims.get(TOKEN_USE_CLAIM, String.class));
    }

    /**
     * Validaciones de forma del desafío MFA (además de firma/exp ya verificadas en {@link #parse(String)}).
     */
    public void assertMfaChallengeShape(Claims claims) {
        if (!isMfaChallengeToken(claims)) {
            throw new IllegalArgumentException("token_use distinto de MFA_CHALLENGE");
        }
        String jti = claims.getId();
        if (jti == null || jti.isBlank()) {
            throw new IllegalArgumentException("MFA challenge sin jti");
        }
        Date iat = claims.getIssuedAt();
        Date exp = claims.getExpiration();
        if (iat == null || exp == null) {
            throw new IllegalArgumentException("MFA challenge sin iat o exp");
        }
        long spanMs = exp.getTime() - iat.getTime();
        if (spanMs <= 0 || spanMs > MFA_CHALLENGE_MAX_MS) {
            throw new IllegalArgumentException("ventana exp del challenge MFA inválida (máx 5 min)");
        }
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }
}

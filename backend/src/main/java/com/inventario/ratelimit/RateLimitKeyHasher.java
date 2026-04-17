package com.inventario.ratelimit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Huellas para claves de cubo sin almacenar email en claro en el mapa en memoria.
 */
public final class RateLimitKeyHasher {

    private RateLimitKeyHasher() {}

    public static String emailFingerprint(String normalizedEmail, String pepper) {
        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            return "empty";
        }
        String body = normalizedEmail.trim().toLowerCase(Locale.ROOT) + ":" + (pepper == null ? "" : pepper);
        return sha256Hex(body);
    }

    public static String challengeFingerprint(String challengeToken, String pepper) {
        if (challengeToken == null || challengeToken.isBlank()) {
            return "empty";
        }
        String body = challengeToken.trim() + ":" + (pepper == null ? "" : pepper);
        return sha256Hex(body);
    }

    /** Huella del refresh en claro para cubos de rate limit (no es el hash de persistencia). */
    public static String refreshTokenFingerprint(String refreshPlain, String pepper) {
        if (refreshPlain == null || refreshPlain.isBlank()) {
            return "empty";
        }
        String body = refreshPlain.trim() + ":" + (pepper == null ? "" : pepper);
        return sha256Hex(body);
    }

    private static String sha256Hex(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(d);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}

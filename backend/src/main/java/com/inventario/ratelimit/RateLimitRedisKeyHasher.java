package com.inventario.ratelimit;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Deriva fragmento de clave Redis estable y corto sin incluir el bucket en claro en la clave.
 */
final class RateLimitRedisKeyHasher {

    private RateLimitRedisKeyHasher() {}

    static String bucketDigest(String namespace, String bucketKey) {
        String material = namespace + "\u0000" + (bucketKey == null ? "" : bucketKey);
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(material.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}

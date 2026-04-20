package com.inventario.service.security;

import com.inventario.config.RefreshTokenProperties;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class RefreshTokenHasher {

    private final String pepper;

    public RefreshTokenHasher(RefreshTokenProperties properties) {
        String p = properties.getHashPepper();
        this.pepper = p == null ? "" : p;
    }

    /** Hash determinista para búsqueda por igualdad en BD (token opaco de alta entropía + pepper). */
    public String hashOpaqueToken(String plainRefreshToken) {
        if (plainRefreshToken == null) {
            throw new IllegalArgumentException("refresh token nulo");
        }
        String material = plainRefreshToken + ":" + pepper;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(material.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}

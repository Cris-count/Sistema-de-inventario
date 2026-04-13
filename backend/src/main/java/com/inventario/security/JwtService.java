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

/**
 * JWT firmado (HS256). Claims relevantes:
 * <ul>
 *     <li>{@code sub} — email del usuario (identidad para el filtro JWT)</li>
 *     <li>{@code uid} — id de usuario al momento del login (informativo; la autorización no confía solo en esto)</li>
 *     <li>{@code rol} — código de rol canónico ({@link SecurityRoles#canonicalCodigo(String)}) al emitir el token</li>
 *     <li>{@code empresaId} / {@code empresaNombre} — contexto de empresa (opcional; la autorización efectiva sigue en BD)</li>
 *     <li>{@code iat} / {@code exp} — emisión y expiración</li>
 * </ul>
 * El {@link com.inventario.security.JwtAuthenticationFilter} vuelve a cargar el rol desde la base de datos;
 * el claim {@code rol} sirve para depuración y coherencia del payload, no sustituye a la BD.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret debe tener al menos 32 bytes (256 bits) para HS256");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirationMs = expirationMs;
    }

    public String generateToken(String email, Long userId, String rolCodigo) {
        return generateToken(email, userId, rolCodigo, null, null);
    }

    public String generateToken(String email, Long userId, String rolCodigo, Long empresaId, String empresaNombre) {
        Date now = new Date();
        Date exp = new Date(now.getTime() + expirationMs);
        String rol = SecurityRoles.canonicalCodigo(rolCodigo);
        if (rol.isEmpty()) {
            throw new IllegalArgumentException("rolCodigo no puede estar vacío en el JWT");
        }
        var b = Jwts.builder()
                .subject(email)
                .claim("uid", userId)
                .claim("rol", rol)
                .issuedAt(now)
                .expiration(exp);
        if (empresaId != null) {
            b.claim("empresaId", empresaId);
        }
        if (empresaNombre != null && !empresaNombre.isBlank()) {
            b.claim("empresaNombre", empresaNombre);
        }
        return b.signWith(key).compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parse(token).getSubject();
    }
}

package com.inventario.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtServiceTest {

    private static final String SECRET_32_PLUS = "cambiarEnProduccionMinimo256BitsParaHS256AlgoritmoSeguro!!";

    @Test
    void tokenIncludesRolClaimReadableByParser() {
        JwtService jwt = new JwtService(SECRET_32_PLUS, 3_600_000L);
        String token = jwt.generateToken("admin@test.local", 1L, "ADMIN");
        var claims = jwt.parse(token);
        assertEquals("ADMIN", claims.get("rol", String.class));
        assertEquals("admin@test.local", claims.getSubject());
    }

    @Test
    void generateTokenRejectsBlankRol() {
        JwtService jwt = new JwtService(SECRET_32_PLUS, 3_600_000L);
        assertThrows(IllegalArgumentException.class, () -> jwt.generateToken("a@b.c", 1L, "  "));
    }
}

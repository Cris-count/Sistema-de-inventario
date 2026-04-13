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
    void tokenCanonicalizesRolClaim() {
        JwtService jwt = new JwtService(SECRET_32_PLUS, 3_600_000L);
        String token = jwt.generateToken("a@b.c", 1L, "  admin  ");
        assertEquals("ADMIN", jwt.parse(token).get("rol", String.class));
    }

    @Test
    void generateTokenRejectsBlankRol() {
        JwtService jwt = new JwtService(SECRET_32_PLUS, 3_600_000L);
        assertThrows(IllegalArgumentException.class, () -> jwt.generateToken("a@b.c", 1L, "  "));
    }

    @Test
    void tokenIncludesEmpresaClaimsWhenProvided() {
        JwtService jwt = new JwtService(SECRET_32_PLUS, 3_600_000L);
        String token = jwt.generateToken("admin@test.local", 1L, "ADMIN", 99L, "Acme");
        var claims = jwt.parse(token);
        assertEquals(99L, ((Number) claims.get("empresaId")).longValue());
        assertEquals("Acme", claims.get("empresaNombre", String.class));
    }
}

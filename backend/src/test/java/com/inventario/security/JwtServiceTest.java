package com.inventario.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRET_32_PLUS = "cambiarEnProduccionMinimo256BitsParaHS256AlgoritmoSeguro!!";
    private static final String ISS = "https://test-issuer.local";
    private static final String AUD = "test-audience";

    private static JwtService jwt(long accessExpMs) {
        return new JwtService(SECRET_32_PLUS, accessExpMs, 300_000L, ISS, AUD);
    }

    @Test
    void constructorRejectsBlankSecret() {
        assertThrows(IllegalStateException.class, () -> new JwtService("  ", 3_600_000L, 300_000L, ISS, AUD));
    }

    @Test
    void tokenIncludesRolAccessTypeIssuerAud() {
        JwtService jwt = jwt(3_600_000L);
        String token = jwt.generateToken("admin@test.local", 1L, "ADMIN", 10L, null);
        var claims = jwt.parse(token);
        assertEquals("ACCESS", claims.get(JwtService.TOKEN_USE_CLAIM, String.class));
        assertEquals("ADMIN", claims.get("rol", String.class));
        assertEquals("admin@test.local", claims.getSubject());
        assertEquals(ISS, claims.getIssuer());
        assertTrue(claims.getAudience().contains(AUD));
    }

    @Test
    void tokenCanonicalizesRolClaim() {
        JwtService jwt = jwt(3_600_000L);
        String token = jwt.generateToken("a@b.c", 1L, "  admin  ", 1L, null);
        assertEquals("ADMIN", jwt.parse(token).get("rol", String.class));
    }

    @Test
    void generateTokenRejectsBlankRol() {
        JwtService jwt = jwt(3_600_000L);
        assertThrows(IllegalArgumentException.class, () -> jwt.generateToken("a@b.c", 1L, "  ", 1L, null));
    }

    @Test
    void generateTokenRequiresEmpresaId() {
        JwtService jwt = jwt(3_600_000L);
        assertThrows(IllegalArgumentException.class, () -> jwt.generateToken("a@b.c", 1L, "ADMIN", null, "X"));
    }

    @Test
    void tokenIncludesEmpresaClaimsWhenProvided() {
        JwtService jwt = jwt(3_600_000L);
        String token = jwt.generateToken("admin@test.local", 1L, "ADMIN", 99L, "Acme");
        var claims = jwt.parse(token);
        assertEquals(99L, ((Number) claims.get("empresaId")).longValue());
        assertEquals("Acme", claims.get("empresaNombre", String.class));
    }

    @Test
    void challengeTokenHasExpectedClaims() {
        JwtService jwt = jwt(3_600_000L);
        String ch = jwt.generateMfaChallengeToken("u@test.local");
        var c = jwt.parse(ch);
        assertEquals(JwtService.TOKEN_USE_MFA_CHALLENGE, c.get(JwtService.TOKEN_USE_CLAIM, String.class));
        assertEquals("u@test.local", c.getSubject());
        assertFalse(c.getId().isBlank());
        assertEquals(ISS, c.getIssuer());
        assertTrue(c.getAudience().contains(AUD));
    }
}

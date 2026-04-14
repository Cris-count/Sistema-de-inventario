package com.inventario.security;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TenantJwtClaimsValidatorTest {

    private static final String SECRET = "cambiarEnProduccionMinimo256BitsParaHS256AlgoritmoSeguro!!";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private final TenantJwtClaimsValidator validator = new TenantJwtClaimsValidator();

    @Test
    void sinClaimEmpresa_siempreConsistente() {
        var claims = Jwts.parser().verifyWith(KEY).build()
                .parseSignedClaims(tokenWithoutEmpresa()).getPayload();
        Usuario u = usuarioConEmpresa(5L);
        assertTrue(validator.empresaClaimConsistentWithUser(claims, u));
    }

    @Test
    void claimEmpresaCoincide_ok() {
        var claims = Jwts.parser().verifyWith(KEY).build()
                .parseSignedClaims(tokenWithEmpresa(5L)).getPayload();
        Usuario u = usuarioConEmpresa(5L);
        assertTrue(validator.empresaClaimConsistentWithUser(claims, u));
    }

    @Test
    void claimEmpresaDistinta_rechaza() {
        var claims = Jwts.parser().verifyWith(KEY).build()
                .parseSignedClaims(tokenWithEmpresa(99L)).getPayload();
        Usuario u = usuarioConEmpresa(5L);
        assertFalse(validator.empresaClaimConsistentWithUser(claims, u));
    }

    private static String tokenWithoutEmpresa() {
        Date now = new Date();
        return Jwts.builder()
                .subject("a@b.c")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 60_000))
                .signWith(KEY)
                .compact();
    }

    private static String tokenWithEmpresa(long empresaId) {
        Date now = new Date();
        return Jwts.builder()
                .subject("a@b.c")
                .claim("empresaId", empresaId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 60_000))
                .signWith(KEY)
                .compact();
    }

    private static Usuario usuarioConEmpresa(long empresaId) {
        Empresa e = Empresa.builder()
                .id(empresaId)
                .nombre("E")
                .identificacion("ID-" + empresaId)
                .estado(EstadoEmpresa.ACTIVA)
                .build();
        Rol r = new Rol();
        r.setId(1L);
        r.setCodigo("ADMIN");
        Usuario u = new Usuario();
        u.setEmpresa(e);
        u.setRol(r);
        return u;
    }
}

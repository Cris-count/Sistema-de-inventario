package com.inventario.service.security;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Usuario;
import com.inventario.security.JwtService;
import com.inventario.web.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Emisión del JWT de acceso y del DTO de respuesta; la autenticación por contraseña/MFA queda en otros servicios.
 */
@Service
@RequiredArgsConstructor
public class AccessTokenIssuer {

    private final JwtService jwtService;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public TokenResponse issueForUser(Usuario u) {
        if (u.getEmpresa() == null || u.getEmpresa().getId() == null) {
            throw new IllegalStateException("No se puede emitir JWT de acceso sin empresa asignada.");
        }
        var r = u.getRol();
        var e = u.getEmpresa();
        String token = jwtService.generateToken(
                u.getEmail(), u.getId(), r.getCodigo(), e.getId(), e.getNombre());
        var summary = new TokenResponse.UserSummary(
                u.getId(),
                u.getEmail(),
                u.getNombre(),
                SecurityRoles.canonicalCodigo(r.getCodigo()),
                r.getNombre(),
                e.getId(),
                e.getNombre());
        return new TokenResponse(token, "Bearer", expirationMs / 1000, summary, null, null);
    }
}

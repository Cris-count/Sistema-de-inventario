package com.inventario.security;

import com.inventario.domain.entity.Usuario;
import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Component;

/**
 * Si el JWT incluye el claim {@code empresaId}, debe coincidir con la empresa vigente del usuario en BD.
 * Si el claim falta, este validador no falla (compatibilidad); la obligación de exigir el claim la aplica
 * {@link JwtAuthenticationFilter} salvo {@code app.jwt.allow-legacy-access-without-empresa-claim=true}.
 */
@Component
public class TenantJwtClaimsValidator {

    public boolean empresaClaimConsistentWithUser(Claims claims, Usuario usuario) {
        Object raw = claims.get("empresaId");
        if (raw == null) {
            return true;
        }
        if (usuario.getEmpresa() == null || usuario.getEmpresa().getId() == null) {
            return false;
        }
        Long claimEmpresaId = parseLongClaim(raw);
        if (claimEmpresaId == null) {
            return false;
        }
        return claimEmpresaId.equals(usuario.getEmpresa().getId());
    }

    private static Long parseLongClaim(Object raw) {
        if (raw instanceof Number n) {
            return n.longValue();
        }
        if (raw instanceof String s && !s.isBlank()) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }
}

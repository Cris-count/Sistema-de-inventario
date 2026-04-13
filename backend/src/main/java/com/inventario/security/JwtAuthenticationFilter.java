package com.inventario.security;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

import static com.inventario.web.error.ApiErrorMessages.UNAUTHORIZED_JWT_DETAIL;

/**
 * Valida el JWT y fija la autenticación usando el rol vigente en base de datos (no solo el claim {@code rol}
 * del token), para que cambios de rol y la UI alineada con {@code /auth/me} no queden en conflicto con permisos.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final TenantJwtClaimsValidator tenantJwtClaimsValidator;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || header.length() < 8) {
            filterChain.doFilter(request, response);
            return;
        }
        if (!header.substring(0, 7).equalsIgnoreCase("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            writeUnauthorized(request, response);
            return;
        }
        try {
            Claims claims = jwtService.parse(token);
            String email = claims.getSubject();
            if (email == null || email.isBlank()) {
                writeUnauthorized(request, response);
                return;
            }
            var usuario = usuarioRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
            if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
                writeUnauthorized(request, response);
                return;
            }
            if (usuario.getEmpresa() == null || usuario.getEmpresa().getEstado() != EstadoEmpresa.ACTIVA) {
                writeUnauthorized(request, response);
                return;
            }
            if (!tenantJwtClaimsValidator.empresaClaimConsistentWithUser(claims, usuario)) {
                writeUnauthorized(request, response);
                return;
            }
            // No exigir coincidencia del claim "uid" con el id en BD: tras resembrar datos el mismo
            // email puede tener otro id y un JWT antiguo seguiría siendo criptográficamente válido.
            // La identidad efectiva la define el subject (email) verificado y el usuario activo en BD.
            var rolEntity = usuario.getRol();
            if (rolEntity == null || rolEntity.getCodigo() == null || rolEntity.getCodigo().isBlank()) {
                writeUnauthorized(request, response);
                return;
            }
            String authority = SecurityRoles.canonicalCodigo(rolEntity.getCodigo());
            if (authority.isEmpty()) {
                writeUnauthorized(request, response);
                return;
            }
            var auth = new UsernamePasswordAuthenticationToken(
                    email.trim(),
                    null,
                    List.of(new SimpleGrantedAuthority(authority))
            );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
            SecurityContextHolder.clearContext();
            writeUnauthorized(request, response);
            return;
        }
        filterChain.doFilter(request, response);
    }

    private static void writeUnauthorized(HttpServletRequest request, HttpServletResponse response) throws IOException {
        SecurityErrorResponseWriter.writeProblemDetail(request, response, 401, "Autenticación", UNAUTHORIZED_JWT_DETAIL);
    }
}

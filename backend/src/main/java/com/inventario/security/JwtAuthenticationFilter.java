package com.inventario.security;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
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
 * Valida el JWT de acceso ({@code token_use=ACCESS}, {@code iss}, {@code aud}) y fija la autenticación con rol en BD.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;
    private final TenantJwtClaimsValidator tenantJwtClaimsValidator;
    private final boolean allowLegacyAccessWithoutEmpresaClaim;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository,
            TenantJwtClaimsValidator tenantJwtClaimsValidator,
            @Value("${app.jwt.allow-legacy-access-without-empresa-claim:false}")
            boolean allowLegacyAccessWithoutEmpresaClaim) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
        this.tenantJwtClaimsValidator = tenantJwtClaimsValidator;
        this.allowLegacyAccessWithoutEmpresaClaim = allowLegacyAccessWithoutEmpresaClaim;
    }

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
            jwtService.assertIssuerAndAudience(claims);
            if (jwtService.isMfaChallengeToken(claims)) {
                writeUnauthorized(request, response);
                return;
            }
            if (!jwtService.isAccessToken(claims)) {
                writeUnauthorized(request, response);
                return;
            }
            String email = claims.getSubject();
            if (email == null || email.isBlank()) {
                writeUnauthorized(request, response);
                return;
            }
            if (!allowLegacyAccessWithoutEmpresaClaim && claims.get("empresaId") == null) {
                writeUnauthorized(request, response);
                return;
            }
            var usuario = usuarioRepository.findByEmailIgnoreCase(email.trim()).orElse(null);
            if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
                writeUnauthorized(request, response);
                return;
            }
            if (usuario.getEmpresa() == null
                    || !usuario.getEmpresa().getEstado().permiteAccesoUsuarios()) {
                writeUnauthorized(request, response);
                return;
            }
            if (!tenantJwtClaimsValidator.empresaClaimConsistentWithUser(claims, usuario)) {
                writeUnauthorized(request, response);
                return;
            }
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

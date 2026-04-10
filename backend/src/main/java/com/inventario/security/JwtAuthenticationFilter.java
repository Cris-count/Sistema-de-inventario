package com.inventario.security;

import com.inventario.domain.repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Valida el JWT y fija la autenticación usando el rol vigente en base de datos (no solo el claim {@code rol}
 * del token), para que cambios de rol y la UI alineada con {@code /auth/me} no queden en conflicto con permisos.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

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
            var usuario = usuarioRepository.findByEmail(email.trim()).orElse(null);
            if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
                writeUnauthorized(request, response);
                return;
            }
            Object uidObj = claims.get("uid");
            if (uidObj != null) {
                long tokenUserId = uidObj instanceof Number n ? n.longValue() : Long.parseLong(String.valueOf(uidObj).trim());
                if (!usuario.getId().equals(tokenUserId)) {
                    writeUnauthorized(request, response);
                    return;
                }
            }
            var rolEntity = usuario.getRol();
            if (rolEntity == null || rolEntity.getCodigo() == null || rolEntity.getCodigo().isBlank()) {
                writeUnauthorized(request, response);
                return;
            }
            String authority = rolEntity.getCodigo().trim();
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
        applyCorsForBrowserDev(request, response);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(
                "{\"type\":\"about:blank\",\"title\":\"Autenticación\",\"status\":401,"
                        + "\"detail\":\"Token inválido, expirado o usuario inactivo. Cierre sesión e inicie de nuevo.\"}"
        );
    }

    /** Misma política que {@link SecurityConfig#corsConfigurationSource()} para respuestas cortadas en el filtro. */
    private static void applyCorsForBrowserDev(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null) {
            return;
        }
        if ("http://localhost:4200".equals(origin) || "http://127.0.0.1:4200".equals(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }
}

package com.inventario.service;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.security.JwtService;
import com.inventario.web.dto.LoginRequest;
import com.inventario.web.dto.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public TokenResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        var u = usuarioRepository.findByEmailIgnoreCase(req.email()).orElseThrow();
        var r = u.getRol();
        var e = u.getEmpresa();
        String token = jwtService.generateToken(
                u.getEmail(), u.getId(), r.getCodigo(), e != null ? e.getId() : null, e != null ? e.getNombre() : null);
        var summary = new TokenResponse.UserSummary(
                u.getId(),
                u.getEmail(),
                u.getNombre(),
                SecurityRoles.canonicalCodigo(r.getCodigo()),
                r.getNombre(),
                e != null ? e.getId() : null,
                e != null ? e.getNombre() : null
        );
        return new TokenResponse(token, "Bearer", expirationMs / 1000, summary);
    }
}

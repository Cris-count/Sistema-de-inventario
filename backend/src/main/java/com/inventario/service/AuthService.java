package com.inventario.service;

import com.inventario.audit.AuthAuditLogger;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.security.JwtService;
import com.inventario.service.security.AuthTokenPairIssuer;
import com.inventario.web.dto.LoginRequest;
import com.inventario.web.dto.auth.AuthLoginResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

/**
 * Orquesta credenciales (password) y bifurca login con o sin MFA; emisión de tokens delega en {@link AuthTokenPairIssuer}.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final AuthTokenPairIssuer authTokenPairIssuer;
    private final AuthAuditLogger authAuditLogger;

    public AuthLoginResponse login(LoginRequest req, HttpServletRequest httpRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        var u = usuarioRepository.findByEmailIgnoreCase(req.email()).orElseThrow();
        if (u.isMfaEnabled()) {
            authAuditLogger.mfaChallengeIssued(u.getId());
            String challenge = jwtService.generateMfaChallengeToken(u.getEmail());
            return AuthLoginResponse.mfaChallenge(challenge);
        }
        var token = authTokenPairIssuer.issueForUser(u, httpRequest);
        authAuditLogger.accessTokenIssuedAfterPasswordOnly(u.getId(), u.getEmpresa().getId());
        return AuthLoginResponse.withAccessToken(token);
    }
}

package com.inventario.service.security;

import com.inventario.domain.entity.Usuario;
import com.inventario.web.dto.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Emite par access + refresh tras autenticación fuerte (password o MFA); el refresh no sustituye MFA en login.
 */
@Service
@RequiredArgsConstructor
public class AuthTokenPairIssuer {

    private final AccessTokenIssuer accessTokenIssuer;
    private final RefreshTokenService refreshTokenService;

    public TokenResponse issueForUser(Usuario usuario, HttpServletRequest request) {
        TokenResponse access = accessTokenIssuer.issueForUser(usuario);
        RefreshTokenService.IssuedRefresh refresh = refreshTokenService.createFreshFamily(usuario, request);
        return new TokenResponse(
                access.accessToken(),
                access.tokenType(),
                access.expiresIn(),
                access.user(),
                refresh.plainToken(),
                refresh.refreshExpiresInSeconds());
    }
}

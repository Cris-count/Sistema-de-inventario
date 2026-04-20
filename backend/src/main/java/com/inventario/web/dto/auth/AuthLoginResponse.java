package com.inventario.web.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.inventario.service.mfa.MfaBlockCodes;
import com.inventario.web.dto.TokenResponse;

/**
 * Respuesta unificada de login: JWT completo o desafío MFA (sin JWT de acceso).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthLoginResponse(
        boolean mfaRequired,
        String challengeToken,
        /** Presente cuando {@code mfaRequired}; alineado con Problem Details {@code blockCode}. */
        String blockCode,
        String accessToken,
        String tokenType,
        Long expiresIn,
        TokenResponse.UserSummary user,
        String refreshToken,
        Long refreshExpiresIn
) {
    public static AuthLoginResponse mfaChallenge(String challengeToken) {
        return new AuthLoginResponse(
                true, challengeToken, MfaBlockCodes.MFA_REQUIRED, null, null, null, null, null, null);
    }

    public static AuthLoginResponse withAccessToken(TokenResponse token) {
        return new AuthLoginResponse(
                false,
                null,
                null,
                token.accessToken(),
                token.tokenType(),
                token.expiresIn(),
                token.user(),
                token.refreshToken(),
                token.refreshExpiresIn());
    }
}

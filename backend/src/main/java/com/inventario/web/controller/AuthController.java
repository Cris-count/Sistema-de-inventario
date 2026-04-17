package com.inventario.web.controller;

import com.inventario.config.SecurityRoles;
import com.inventario.ratelimit.ApplicationRateLimitService;
import com.inventario.service.AuthService;
import com.inventario.service.CurrentUserService;
import com.inventario.service.mfa.MfaAuthService;
import com.inventario.service.mfa.MfaEnrollmentService;
import com.inventario.web.dto.LoginRequest;
import com.inventario.web.dto.TokenResponse;
import com.inventario.web.dto.auth.AuthLoginResponse;
import com.inventario.web.dto.auth.LogoutRequest;
import com.inventario.web.dto.auth.MfaDisableRequest;
import com.inventario.web.dto.auth.MfaEnableRequest;
import com.inventario.web.dto.auth.MfaSetupResponse;
import com.inventario.web.dto.auth.MfaVerifyRequest;
import com.inventario.web.dto.auth.RefreshTokenRequest;
import com.inventario.service.security.RefreshTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;
    private final MfaAuthService mfaAuthService;
    private final MfaEnrollmentService mfaEnrollmentService;
    private final ApplicationRateLimitService applicationRateLimitService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(
            summary = "Login",
            description =
                    "Sin MFA: accessToken + refreshToken. Con MFA: challengeToken (sin JWT de acceso) para POST /auth/mfa/verify.")
    public AuthLoginResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpRequest) {
        applicationRateLimitService.assertLoginAllowed(httpRequest, req.email());
        return authService.login(req, httpRequest);
    }

    @PostMapping("/mfa/verify")
    @ResponseStatus(HttpStatus.OK)
    @SecurityRequirements
    @Operation(
            summary = "Completar login MFA",
            description =
                    "Canjea challengeToken por accessToken + refreshToken (código TOTP de 6 dígitos o código de respaldo de 8 hex).")
    public TokenResponse verifyMfa(@Valid @RequestBody MfaVerifyRequest req, HttpServletRequest httpRequest) {
        applicationRateLimitService.assertMfaVerifyAllowed(httpRequest, req.challengeToken());
        return mfaAuthService.verify(req, httpRequest);
    }

    @PostMapping("/refresh")
    @SecurityRequirements
    @Operation(summary = "Renovar sesión", description = "Canjea refreshToken opaco por un nuevo par access + refresh (rotación).")
    public TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest req, HttpServletRequest httpRequest) {
        applicationRateLimitService.assertRefreshAllowed(httpRequest, req.refreshToken());
        return refreshTokenService.refresh(req.refreshToken(), httpRequest);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirements
    @Operation(summary = "Cerrar sesión", description = "Revoca la familia de refresh tokens asociada al token enviado (si se reconoce).")
    public void logout(@RequestBody(required = false) LogoutRequest req, HttpServletRequest httpRequest) {
        String rt = req != null ? req.refreshToken() : null;
        applicationRateLimitService.assertLogoutAllowed(httpRequest, rt);
        if (rt != null && !rt.isBlank()) {
            refreshTokenService.logout(rt, httpRequest);
        }
    }

    @PostMapping("/mfa/setup")
    @ResponseStatus(HttpStatus.OK)
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Generar secreto TOTP, URI otpauth y códigos de respaldo (requiere sesión; guardar backupCodes de forma segura)")
    public MfaSetupResponse setupMfa() {
        return mfaEnrollmentService.setup();
    }

    @PostMapping("/mfa/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Activar MFA tras validar un código TOTP")
    public void enableMfa(@Valid @RequestBody MfaEnableRequest req) {
        mfaEnrollmentService.enable(req);
    }

    @PostMapping("/mfa/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearer-jwt")
    @Operation(summary = "Desactivar MFA (contraseña + código TOTP)")
    public void disableMfa(@Valid @RequestBody MfaDisableRequest req) {
        mfaEnrollmentService.disable(req);
    }

    @GetMapping("/me")
    @Operation(summary = "Perfil actual")
    public TokenResponse.UserSummary me() {
        var u = currentUserService.requireUsuario();
        var r = u.getRol();
        var e = u.getEmpresa();
        return new TokenResponse.UserSummary(
                u.getId(),
                u.getEmail(),
                u.getNombre(),
                SecurityRoles.canonicalCodigo(r.getCodigo()),
                r.getNombre(),
                e != null ? e.getId() : null,
                e != null ? e.getNombre() : null);
    }
}

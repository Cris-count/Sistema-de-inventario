package com.inventario.web.controller;

import com.inventario.config.SecurityRoles;
import com.inventario.service.AuthService;
import com.inventario.service.CurrentUserService;
import com.inventario.web.dto.LoginRequest;
import com.inventario.web.dto.TokenResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;

    @PostMapping("/login")
    @SecurityRequirements
    @Operation(summary = "Login", description = "Devuelve JWT. Usuario semilla: admin@inventario.local / Admin123! (configurable)")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
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

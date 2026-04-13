package com.inventario.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Locale;

public record LoginRequest(
        @Email @NotBlank String email,
        @NotBlank String password
) {
    /**
     * Normaliza espacios y mayúsculas en el correo (los emails no distinguen mayúsculas; evita fallos de login
     * si en BD quedó otro casing o el cliente envía distinto).
     */
    public LoginRequest {
        email = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        password = password == null ? "" : password.trim();
    }
}

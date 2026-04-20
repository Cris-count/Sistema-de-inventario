package com.inventario.web.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaVerifyRequest(
        @NotBlank String challengeToken,
        @NotBlank
        @Pattern(
                regexp = "^(\\d{6}|[A-Fa-f0-9]{8})$",
                message = "Código TOTP de 6 dígitos o código de respaldo de 8 caracteres hexadecimales")
        String code
) {}

package com.inventario.web.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaDisableRequest(
        @NotBlank String password,
        @NotBlank @Pattern(regexp = "^\\d{6}$", message = "El código debe tener 6 dígitos") String code
) {}

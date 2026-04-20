package com.inventario.web.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaEnableRequest(
        @NotBlank @Pattern(regexp = "^\\d{6}$", message = "El código debe tener 6 dígitos") String code
) {}

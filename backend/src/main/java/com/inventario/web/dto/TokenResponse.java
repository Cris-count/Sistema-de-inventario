package com.inventario.web.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummary user
) {
    public record UserSummary(Long id, String email, String nombre, String rolCodigo, String rolNombre) {}
}

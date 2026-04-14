package com.inventario.web.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummary user
) {
    /**
     * Campos originales se mantienen; {@code empresaId} y {@code empresaNombre} amplían el contrato para multi-empresa.
     */
    public record UserSummary(
            Long id,
            String email,
            String nombre,
            String rolCodigo,
            String rolNombre,
            Long empresaId,
            String empresaNombre
    ) {}
}

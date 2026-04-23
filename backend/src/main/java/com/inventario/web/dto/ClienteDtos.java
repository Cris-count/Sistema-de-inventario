package com.inventario.web.dto;

import jakarta.validation.constraints.NotBlank;

public final class ClienteDtos {

    public record ClienteCreateRequest(
            @NotBlank String nombre,
            String documento,
            String telefono,
            String email
    ) {}

    public record ClienteResponse(
            Long id,
            String nombre,
            String documento,
            String telefono,
            String email,
            boolean activo
    ) {}
}

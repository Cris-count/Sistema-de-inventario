package com.inventario.web.dto.empresa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class CambioPlanDtos {

    private CambioPlanDtos() {}

    public record CambioPlanSolicitudRequest(@NotBlank @Size(max = 40) String planCodigo) {}

    public record CambioPlanSolicitudResponse(
            String resultado,
            String mensaje,
            Long compraId,
            Long pagoId,
            String planCodigoSolicitado) {}

    public record CambioPlanCancelacionResponse(
            String resultado,
            String mensaje,
            Long compraId,
            Long pagoId) {}
}

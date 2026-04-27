package com.inventario.web.dto;

import java.math.BigDecimal;
import java.time.Instant;

public final class InventarioDtos {

    private InventarioDtos() {}

    public record InventarioRowResponse(
            Long productoId,
            String productoCodigo,
            String productoNombre,
            String unidadMedida,
            boolean productoActivo,
            Long bodegaId,
            String bodegaCodigo,
            String bodegaNombre,
            BigDecimal cantidad,
            BigDecimal stockMinimo,
            boolean bajoMinimo,
            Instant updatedAt
    ) {}
}

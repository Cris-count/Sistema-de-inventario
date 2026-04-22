package com.inventario.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class AbastecimientoDtos {

    private AbastecimientoDtos() {}

    public record AbastecimientoPanelResponse(
            ResumenAbastecimientoDto resumen, List<ProductoPorReponerDto> productos) {}

    public record ResumenAbastecimientoDto(
            int totalLineasReposicion,
            int sinStock,
            int criticos,
            int bajoMinimo,
            long entradasHoy) {}

    public record ProductoPorReponerDto(
            long productoId,
            String codigo,
            String nombre,
            long bodegaId,
            String nombreBodega,
            BigDecimal stockActual,
            BigDecimal stockMinimo,
            /** SIN_STOCK | CRITICO | BAJO */
            String estadoReposicion,
            Long proveedorId,
            String proveedorNombre,
            /** PREFERIDO | ULTIMA_ENTRADA o null si no hay proveedor */
            String fuenteProveedor,
            Instant fechaUltimaEntrada,
            boolean puedeRegistrarEntrada) {}
}

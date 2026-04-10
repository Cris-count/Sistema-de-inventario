package com.inventario.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class MovimientoDtos {

    public record EntradaRequest(
            @NotNull String motivo,
            Long proveedorId,
            String referenciaDocumento,
            String observacion,
            @NotEmpty @Valid List<LineaEntrada> lineas
    ) {}

    public record LineaEntrada(
            @NotNull Long productoId,
            @NotNull Long bodegaDestinoId,
            @NotNull @DecimalMin("0.0001") BigDecimal cantidad
    ) {}

    public record SalidaRequest(
            @NotNull String motivo,
            String referenciaDocumento,
            String observacion,
            @NotEmpty @Valid List<LineaSalida> lineas
    ) {}

    public record LineaSalida(
            @NotNull Long productoId,
            @NotNull Long bodegaOrigenId,
            @NotNull @DecimalMin("0.0001") BigDecimal cantidad
    ) {}

    public record TransferenciaRequest(
            String referenciaDocumento,
            String observacion,
            @NotEmpty @Valid List<LineaTransferencia> lineas
    ) {}

    public record LineaTransferencia(
            @NotNull Long productoId,
            @NotNull Long bodegaOrigenId,
            @NotNull Long bodegaDestinoId,
            @NotNull @DecimalMin("0.0001") BigDecimal cantidad
    ) {}

    public record AjusteRequest(
            @NotNull String motivo,
            String referenciaDocumento,
            @NotEmpty @Valid List<LineaAjuste> lineas
    ) {}

    /** Una línea: solo destino (suma) o solo origen (resta), no ambos. */
    public record LineaAjuste(
            @NotNull Long productoId,
            Long bodegaOrigenId,
            Long bodegaDestinoId,
            @NotNull @DecimalMin("0.0001") BigDecimal cantidad
    ) {}

    public record StockInicialRequest(
            @NotEmpty @Valid List<LineaStockInicial> lineas
    ) {}

    public record LineaStockInicial(
            @NotNull Long productoId,
            @NotNull Long bodegaId,
            @NotNull @DecimalMin("0") BigDecimal cantidad,
            String referencia
    ) {}

    public record MovimientoResponse(
            Long id,
            String tipoMovimiento,
            String motivo,
            String referenciaDocumento,
            String estado,
            List<DetalleResponse> detalles
    ) {}

    public record DetalleResponse(
            Long id,
            Long productoId,
            String productoCodigo,
            BigDecimal cantidad,
            Long bodegaOrigenId,
            Long bodegaDestinoId
    ) {}
}

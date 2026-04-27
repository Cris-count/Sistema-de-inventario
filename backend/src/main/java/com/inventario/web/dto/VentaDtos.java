package com.inventario.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class VentaDtos {

    public record VentaCreateRequest(
            @NotNull Long bodegaId,
            Long clienteId,
            String observacion,
            @NotEmpty @Valid List<VentaLineRequest> lineas
    ) {}

    public record VentaLineRequest(
            @NotNull Long productoId,
            @NotNull @DecimalMin("0.0001") BigDecimal cantidad,
            @NotNull @DecimalMin("0") BigDecimal precioUnitario
    ) {}

    public record VentaCreatedResponse(
            Long id,
            String codigoPublico,
            Long movimientoId,
            Instant fechaVenta,
            BigDecimal total,
            String estado
    ) {}

    public record VentaListItemResponse(
            Long id,
            String codigoPublico,
            Instant fechaVenta,
            Long bodegaId,
            String bodegaNombre,
            BigDecimal total,
            int cantidadLineas,
            Long usuarioId,
            String usuarioEmail,
            Long movimientoId,
            String estado,
            Long clienteId,
            String clienteNombre,
            String pagoEstado
    ) {}

    public record VentaDetalleLineResponse(
            Long id,
            Long productoId,
            String productoCodigo,
            String productoNombre,
            BigDecimal cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal
    ) {}

    public record VentaDetailResponse(
            Long id,
            String codigoPublico,
            Instant fechaVenta,
            Long bodegaId,
            String bodegaNombre,
            BigDecimal total,
            String estado,
            String observacion,
            Long usuarioId,
            String usuarioEmail,
            String usuarioNombre,
            Long movimientoId,
            String movimientoEstado,
            Long clienteId,
            String clienteNombre,
            String clienteDocumento,
            String clienteTelefono,
            List<VentaDetalleLineResponse> lineas,
            String pagoEstado,
            Instant paidAt,
            String stripeCheckoutSessionId,
            String empresaNombre,
            /** Etiqueta operativa para comprobante (ej. tarjeta vs venta registrada sin cobro con tarjeta). */
            String metodoPagoEtiqueta
    ) {}

    public record VentaStripePrepararResponse(
            Long ventaId,
            String codigoPublico,
            BigDecimal total,
            String estadoVenta,
            String checkoutUrl,
            String stripeSessionId
    ) {}

    public record VentaStripeSyncRequest(@NotBlank String sessionId) {}

    public record VentaPanelResumenResponse(
            long ventasHoy,
            BigDecimal unidadesVendidasHoy,
            BigDecimal totalVendidoHoy,
            long ventasUltimos7Dias
    ) {}

    /** Fase 3: ranking operativo en un rango (confirmadas = métricas comerciales; anuladas = conteo y monto histórico). */
    public record VentaProductoRankingItem(
            Long productoId,
            String codigo,
            String nombre,
            BigDecimal cantidadVendida,
            BigDecimal subtotalConfirmado
    ) {}

    public record VentaVendedorBucketItem(
            Long usuarioId, String usuarioEmail, long ventasConfirmadas, BigDecimal totalMonto
    ) {}

    public record VentaBodegaBucketItem(
            Long bodegaId, String bodegaNombre, long ventasConfirmadas, BigDecimal totalMonto
    ) {}

    public record VentaOperativoResumenResponse(
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            long ventasConfirmadas,
            BigDecimal totalVendidoConfirmado,
            BigDecimal unidadesVendidasConfirmadas,
            long ventasAnuladas,
            BigDecimal montoVentasAnuladasSnapshot,
            List<VentaProductoRankingItem> topProductos,
            List<VentaVendedorBucketItem> porVendedor,
            List<VentaBodegaBucketItem> porBodega
    ) {}
}

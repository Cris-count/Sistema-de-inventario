package com.inventario.web.dto;

import com.inventario.domain.entity.PedidoProveedorMensajeEstado;
import com.inventario.domain.entity.PedidoProveedorMensajeOrigen;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public final class PedidoProveedorMensajeDtos {

    private PedidoProveedorMensajeDtos() {}

    public record PedidoProveedorMensajeResponse(
            Long id,
            PedidoProveedorMensajeOrigen origen,
            PedidoProveedorMensajeEstado estado,
            Long productoId,
            String productoCodigo,
            String productoNombre,
            Long bodegaId,
            String bodegaNombre,
            Long proveedorId,
            String proveedorRazonSocial,
            String proveedorEmail,
            BigDecimal cantidadSugerida,
            BigDecimal cantidadParaProveedor,
            BigDecimal existenciaSnapshot,
            BigDecimal stockMinimoSnapshot,
            String unidadMedida,
            Instant creadoEn,
            Instant resueltoEn,
            Long resueltoPorUsuarioId,
            String resueltoPorNombre,
            String notasAdmin) {}

    public record AprobarPedidoProveedorRequest(
            @NotNull @DecimalMin(value = "0.0001", inclusive = true) BigDecimal cantidadParaProveedor,
            String notasAdmin) {}

    public record RechazarPedidoProveedorRequest(String notasAdmin) {}

    public record ResolverPedidoProveedorResponse(String modo, String mensaje) {}
}

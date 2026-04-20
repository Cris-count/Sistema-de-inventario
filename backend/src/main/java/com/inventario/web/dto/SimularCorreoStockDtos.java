package com.inventario.web.dto;

public final class SimularCorreoStockDtos {

    private SimularCorreoStockDtos() {}

    /**
     * Opcional: si ambos son nulos se usa la primera línea en alerta (bajo mínimo) de la empresa.
     * El destinatario del correo es siempre el del proveedor resuelto (igual que el envío automático).
     */
    public record SimularCorreoStockRequest(Long productoId, Long bodegaId) {}

    /**
     * @param modo {@code enviado_smtp} si salió por el servidor configurado; {@code solo_log} si no hay SMTP (contenido en logs).
     */
    public record SimularCorreoStockResponse(String modo, String mensaje) {}
}

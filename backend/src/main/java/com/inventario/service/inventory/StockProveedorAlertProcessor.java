package com.inventario.service.inventory;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Tras movimientos o cambio de stock mínimo, registra una solicitud de pedido al proveedor en la bandeja del
 * administrador (no envía correo directamente al proveedor).
 */
@Service
@RequiredArgsConstructor
public class StockProveedorAlertProcessor {

    private final PedidoProveedorMensajeService pedidoProveedorMensajeService;

    public void procesar(long empresaId, long productoId, long bodegaId) {
        pedidoProveedorMensajeService.registrarAlertaAutomatica(empresaId, productoId, bodegaId);
    }
}

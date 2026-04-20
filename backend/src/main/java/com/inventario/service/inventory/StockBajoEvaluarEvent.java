package com.inventario.service.inventory;

/**
 * Publicado tras persistir un movimiento que afecta inventario; el listener evalúa si hay que avisar al proveedor.
 */
public record StockBajoEvaluarEvent(long empresaId, long productoId, long bodegaId) {}

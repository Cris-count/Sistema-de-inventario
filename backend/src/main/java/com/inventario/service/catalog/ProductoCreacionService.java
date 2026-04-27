package com.inventario.service.catalog;

import com.inventario.domain.entity.Producto;
import com.inventario.service.MovimientoService;
import com.inventario.web.dto.MovimientoDtos.LineaStockInicial;
import com.inventario.web.dto.MovimientoDtos.StockInicialRequest;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Alta de producto con stock inicial opcional en una sola transacción: el catálogo y el movimiento
 * {@code STOCK_INICIAL} comparten persistencia para no dejar productos huérfanos si falla inventario.
 */
@Service
@RequiredArgsConstructor
public class ProductoCreacionService {

    private final ProductoCatalogService productoCatalogService;
    private final MovimientoService movimientoService;

    @Transactional(rollbackFor = Exception.class)
    public Producto crear(
            String codigo,
            String nombre,
            String descripcion,
            Long categoriaId,
            String unidadMedida,
            BigDecimal stockMinimo,
            BigDecimal purchaseCost,
            BigDecimal salePrice,
            Long proveedorPreferidoId,
            Long initialBodegaId,
            BigDecimal initialCantidad) {
        Producto created =
                productoCatalogService.crear(
                        codigo,
                        nombre,
                        descripcion,
                        categoriaId,
                        unidadMedida,
                        stockMinimo,
                        purchaseCost,
                        salePrice,
                        proveedorPreferidoId);

        BigDecimal qty = initialCantidad != null ? initialCantidad : BigDecimal.ZERO;
        if (qty.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La cantidad inicial no puede ser negativa");
        }
        if (qty.compareTo(BigDecimal.ZERO) > 0) {
            if (initialBodegaId == null) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST,
                        "Debe indicar la bodega inicial cuando la cantidad es mayor que 0");
            }
            String ref = "ALTA_PRODUCTO:" + created.getCodigo();
            movimientoService.stockInicial(
                    new StockInicialRequest(
                            List.of(new LineaStockInicial(created.getId(), initialBodegaId, qty, ref))));
        }

        return created;
    }
}

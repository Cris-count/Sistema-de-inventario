package com.inventario.web.controller;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.entity.Producto;
import com.inventario.service.catalog.ProductoCatalogService;
import com.inventario.service.catalog.ProductoCreacionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ProductoController {

    private final ProductoCatalogService productoCatalogService;
    private final ProductoCreacionService productoCreacionService;

    public record ProductoRequest(
            @NotBlank String codigo,
            @NotBlank String nombre,
            String descripcion,
            @NotNull Long categoriaId,
            String unidadMedida,
            @DecimalMin(value = "0", inclusive = true) BigDecimal purchaseCost,
            @DecimalMin(value = "0", inclusive = true) BigDecimal salePrice,
            BigDecimal stockMinimo,
            Long proveedorPreferidoId,
            /** Solo tiene efecto en POST / alta; si la cantidad es mayor que cero debe informarse la bodega. */
            Long initialBodegaId,
            @DecimalMin(value = "0", inclusive = true) BigDecimal initialCantidad
    ) {}

    public record ActivoRequest(boolean activo) {}

    public record StockMinimoPatchRequest(
            @NotNull @DecimalMin(value = "0", inclusive = true) BigDecimal stockMinimo
    ) {}

    /** Sub-árbol mínimo de categoría (sin empresa ni auditoría). */
    public record ProductoCategoriaResponse(Long id, String nombre, String descripcion, boolean activo) {}

    /**
     * Respuesta estable: sin {@code empresa}, {@code createdBy} ni proxies profundos que rompían la serialización JSON.
     */
    public record ProductoResponse(
            Long id,
            String codigo,
            String nombre,
            String descripcion,
            ProductoCategoriaResponse categoria,
            String unidadMedida,
            BigDecimal stockMinimo,
            BigDecimal purchaseCost,
            BigDecimal salePrice,
            Long proveedorPreferidoId,
            boolean activo
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Listar productos")
    public Page<ProductoResponse> listar(Pageable pageable) {
        return productoCatalogService.listar(pageable).map(ProductoController::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Detalle producto")
    public ProductoResponse get(@PathVariable Long id) {
        return toResponse(productoCatalogService.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear producto")
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest req) {
        return toResponse(
                productoCreacionService.crear(
                        req.codigo(), req.nombre(), req.descripcion(), req.categoriaId(),
                        req.unidadMedida(), req.stockMinimo(), req.purchaseCost(), req.salePrice(), req.proveedorPreferidoId(),
                        req.initialBodegaId(), req.initialCantidad()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Actualizar producto")
    public ProductoResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest req) {
        return toResponse(
                productoCatalogService.actualizar(
                        id, req.codigo(), req.nombre(), req.descripcion(), req.categoriaId(),
                        req.unidadMedida(), req.stockMinimo(), req.purchaseCost(), req.salePrice(), req.proveedorPreferidoId()));
    }

    @PatchMapping("/{id}/stock-minimo")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Actualizar solo el stock mínimo del producto (p. ej. desde inventario)")
    public ProductoResponse actualizarStockMinimo(@PathVariable Long id, @Valid @RequestBody StockMinimoPatchRequest req) {
        return toResponse(productoCatalogService.actualizarStockMinimo(id, req.stockMinimo()));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Activar/desactivar producto")
    public ProductoResponse estado(@PathVariable Long id, @Valid @RequestBody ActivoRequest req) {
        return toResponse(productoCatalogService.cambiarEstado(id, req.activo()));
    }

    private static ProductoResponse toResponse(Producto p) {
        Categoria c = p.getCategoria();
        ProductoCategoriaResponse cat =
                c == null
                        ? null
                        : new ProductoCategoriaResponse(
                                c.getId(),
                                c.getNombre(),
                                c.getDescripcion(),
                                Boolean.TRUE.equals(c.getActivo()));
        return new ProductoResponse(
                p.getId(),
                p.getCodigo(),
                p.getNombre(),
                p.getDescripcion(),
                cat,
                p.getUnidadMedida(),
                p.getStockMinimo(),
                p.getPurchaseCost(),
                p.getSalePrice(),
                p.getProveedorPreferidoId(),
                Boolean.TRUE.equals(p.getActivo()));
    }
}

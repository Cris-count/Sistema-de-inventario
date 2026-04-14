package com.inventario.web.controller;

import com.inventario.domain.entity.Producto;
import com.inventario.service.catalog.ProductoCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
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

    public record ProductoRequest(
            @NotBlank String codigo,
            @NotBlank String nombre,
            String descripcion,
            @NotNull Long categoriaId,
            String unidadMedida,
            BigDecimal stockMinimo
    ) {}

    public record ActivoRequest(boolean activo) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar productos")
    public Page<Producto> listar(Pageable pageable) {
        return productoCatalogService.listar(pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Detalle producto")
    public Producto get(@PathVariable Long id) {
        return productoCatalogService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear producto")
    public Producto crear(@Valid @RequestBody ProductoRequest req) {
        return productoCatalogService.crear(
                req.codigo(), req.nombre(), req.descripcion(), req.categoriaId(),
                req.unidadMedida(), req.stockMinimo());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Actualizar producto")
    public Producto actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest req) {
        return productoCatalogService.actualizar(
                id, req.codigo(), req.nombre(), req.descripcion(), req.categoriaId(),
                req.unidadMedida(), req.stockMinimo());
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Activar/desactivar producto")
    public Producto estado(@PathVariable Long id, @Valid @RequestBody ActivoRequest req) {
        return productoCatalogService.cambiarEstado(id, req.activo());
    }
}

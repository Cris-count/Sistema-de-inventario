package com.inventario.web.controller;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.repository.CategoriaRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.service.CurrentUserService;
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
import java.time.Instant;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ProductoController {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final CurrentUserService currentUserService;

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
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar productos")
    public Page<Producto> listar(Pageable pageable) {
        return productoRepository.findAll(pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Detalle producto")
    public Producto get(@PathVariable Long id) {
        return productoRepository.findById(id).orElseThrow();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear producto")
    public Producto crear(@Valid @RequestBody ProductoRequest req) {
        Categoria cat = categoriaRepository.findById(req.categoriaId()).orElseThrow();
        Producto p = new Producto();
        p.setCodigo(req.codigo());
        p.setNombre(req.nombre());
        p.setDescripcion(req.descripcion());
        p.setCategoria(cat);
        p.setUnidadMedida(req.unidadMedida() != null ? req.unidadMedida() : "UND");
        p.setStockMinimo(req.stockMinimo() != null ? req.stockMinimo() : BigDecimal.ZERO);
        p.setActivo(true);
        p.setCreatedAt(Instant.now());
        p.setCreatedBy(currentUserService.requireUsuario());
        return productoRepository.save(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar producto")
    public Producto actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequest req) {
        Producto p = productoRepository.findById(id).orElseThrow();
        Categoria cat = categoriaRepository.findById(req.categoriaId()).orElseThrow();
        p.setCodigo(req.codigo());
        p.setNombre(req.nombre());
        p.setDescripcion(req.descripcion());
        p.setCategoria(cat);
        p.setUnidadMedida(req.unidadMedida() != null ? req.unidadMedida() : p.getUnidadMedida());
        p.setStockMinimo(req.stockMinimo() != null ? req.stockMinimo() : p.getStockMinimo());
        p.setUpdatedAt(Instant.now());
        return productoRepository.save(p);
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Activar/desactivar producto")
    public Producto estado(@PathVariable Long id, @Valid @RequestBody ActivoRequest req) {
        Producto p = productoRepository.findById(id).orElseThrow();
        p.setActivo(req.activo());
        p.setUpdatedAt(Instant.now());
        return productoRepository.save(p);
    }
}

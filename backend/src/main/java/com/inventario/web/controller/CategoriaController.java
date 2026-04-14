package com.inventario.web.controller;

import com.inventario.domain.entity.Categoria;
import com.inventario.service.catalog.CategoriaCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class CategoriaController {

    private final CategoriaCatalogService categoriaCatalogService;

    public record CategoriaRequest(@NotBlank String nombre, String descripcion) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar categorías")
    public List<Categoria> listar() {
        return categoriaCatalogService.listar();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear categoría")
    public Categoria crear(@Valid @RequestBody CategoriaRequest req) {
        return categoriaCatalogService.crear(req.nombre(), req.descripcion());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar categoría")
    public Categoria actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaRequest req) {
        return categoriaCatalogService.actualizar(id, req.nombre(), req.descripcion());
    }
}

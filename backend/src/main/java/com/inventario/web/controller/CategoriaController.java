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

    /**
     * Sin relaciones JPA: devolver {@link Categoria} tal cual serializaba {@code empresa}/{@code createdBy} y
     * reproducía ciclos Jackson (p. ej. {@code Usuario} → {@code Empresa} → {@code updatedBy} → …).
     */
    public record CategoriaResponse(Long id, String nombre, String descripcion, boolean activo) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar categorías")
    public List<CategoriaResponse> listar() {
        return categoriaCatalogService.listar().stream().map(CategoriaController::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear categoría")
    public CategoriaResponse crear(@Valid @RequestBody CategoriaRequest req) {
        return toResponse(categoriaCatalogService.crear(req.nombre(), req.descripcion()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar categoría")
    public CategoriaResponse actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaRequest req) {
        return toResponse(categoriaCatalogService.actualizar(id, req.nombre(), req.descripcion()));
    }

    private static CategoriaResponse toResponse(Categoria c) {
        return new CategoriaResponse(
                c.getId(),
                c.getNombre(),
                c.getDescripcion(),
                Boolean.TRUE.equals(c.getActivo()));
    }
}

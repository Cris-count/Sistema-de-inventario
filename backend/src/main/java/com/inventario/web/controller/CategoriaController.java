package com.inventario.web.controller;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.repository.CategoriaRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    public record CategoriaRequest(@NotBlank String nombre, String descripcion) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar categorías")
    public List<Categoria> listar() {
        return categoriaRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear categoría")
    public Categoria crear(@Valid @RequestBody CategoriaRequest req) {
        Categoria c = new Categoria();
        c.setNombre(req.nombre());
        c.setDescripcion(req.descripcion());
        c.setActivo(true);
        c.setCreatedAt(Instant.now());
        return categoriaRepository.save(c);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar categoría")
    public Categoria actualizar(@PathVariable Long id, @Valid @RequestBody CategoriaRequest req) {
        Categoria c = categoriaRepository.findById(id).orElseThrow();
        c.setNombre(req.nombre());
        c.setDescripcion(req.descripcion());
        c.setUpdatedAt(Instant.now());
        return categoriaRepository.save(c);
    }
}

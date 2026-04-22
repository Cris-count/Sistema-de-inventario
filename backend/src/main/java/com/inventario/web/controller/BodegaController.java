package com.inventario.web.controller;

import com.inventario.domain.entity.Bodega;
import com.inventario.service.catalog.BodegaCatalogService;
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
@RequestMapping("/api/v1/bodegas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class BodegaController {

    private final BodegaCatalogService bodegaCatalogService;

    public record BodegaRequest(@NotBlank String codigo, @NotBlank String nombre, String direccion) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Listar bodegas")
    public List<Bodega> listar() {
        return bodegaCatalogService.listar();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear bodega")
    public Bodega crear(@Valid @RequestBody BodegaRequest req) {
        return bodegaCatalogService.crear(req.codigo(), req.nombre(), req.direccion());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar bodega")
    public Bodega actualizar(@PathVariable Long id, @Valid @RequestBody BodegaRequest req) {
        return bodegaCatalogService.actualizar(id, req.codigo(), req.nombre(), req.direccion());
    }
}

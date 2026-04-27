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

    /**
     * Respuesta estable sin relaciones JPA: serializar {@link Bodega} tal cual exponía
     * {@code createdBy} → {@link com.inventario.domain.entity.Usuario} (eager {@code empresa}/{@code rol})
     * y producía ciclos o profundidad excesiva; el cliente Angular solo usa estos campos.
     */
    public record BodegaResponse(Long id, String codigo, String nombre, String direccion, boolean activo) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Listar bodegas")
    public List<BodegaResponse> listar() {
        return bodegaCatalogService.listar().stream().map(BodegaController::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear bodega")
    public BodegaResponse crear(@Valid @RequestBody BodegaRequest req) {
        return toResponse(bodegaCatalogService.crear(req.codigo(), req.nombre(), req.direccion()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar bodega")
    public BodegaResponse actualizar(@PathVariable Long id, @Valid @RequestBody BodegaRequest req) {
        return toResponse(bodegaCatalogService.actualizar(id, req.codigo(), req.nombre(), req.direccion()));
    }

    private static BodegaResponse toResponse(Bodega b) {
        return new BodegaResponse(
                b.getId(),
                b.getCodigo(),
                b.getNombre(),
                b.getDireccion(),
                Boolean.TRUE.equals(b.getActivo()));
    }
}

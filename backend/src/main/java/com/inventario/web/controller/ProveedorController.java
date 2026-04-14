package com.inventario.web.controller;

import com.inventario.domain.entity.Proveedor;
import com.inventario.service.catalog.ProveedorCatalogService;
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
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ProveedorController {

    private final ProveedorCatalogService proveedorCatalogService;

    public record ProveedorRequest(
            @NotBlank String documento,
            @NotBlank String razonSocial,
            String contacto,
            String telefono,
            String email
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar proveedores")
    public List<Proveedor> listar() {
        return proveedorCatalogService.listar();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear proveedor")
    public Proveedor crear(@Valid @RequestBody ProveedorRequest req) {
        return proveedorCatalogService.crear(
                req.documento(), req.razonSocial(), req.contacto(), req.telefono(), req.email());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar proveedor")
    public Proveedor actualizar(@PathVariable Long id, @Valid @RequestBody ProveedorRequest req) {
        return proveedorCatalogService.actualizar(
                id, req.documento(), req.razonSocial(), req.contacto(), req.telefono(), req.email());
    }
}

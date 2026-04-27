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

    /** Sin relaciones JPA: evita grafo {@code createdBy} → {@code Usuario} → {@code Empresa} en respuestas. */
    public record ProveedorResponse(
            Long id,
            String documento,
            String razonSocial,
            String contacto,
            String telefono,
            String email,
            boolean activo
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar proveedores")
    public List<ProveedorResponse> listar() {
        return proveedorCatalogService.listar().stream().map(ProveedorController::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear proveedor")
    public ProveedorResponse crear(@Valid @RequestBody ProveedorRequest req) {
        return toResponse(
                proveedorCatalogService.crear(
                        req.documento(), req.razonSocial(), req.contacto(), req.telefono(), req.email()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar proveedor")
    public ProveedorResponse actualizar(@PathVariable Long id, @Valid @RequestBody ProveedorRequest req) {
        return toResponse(
                proveedorCatalogService.actualizar(
                        id, req.documento(), req.razonSocial(), req.contacto(), req.telefono(), req.email()));
    }

    private static ProveedorResponse toResponse(Proveedor p) {
        return new ProveedorResponse(
                p.getId(),
                p.getDocumento(),
                p.getRazonSocial(),
                p.getContacto(),
                p.getTelefono(),
                p.getEmail(),
                Boolean.TRUE.equals(p.getActivo()));
    }
}

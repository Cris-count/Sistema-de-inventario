package com.inventario.web.controller;

import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.repository.ProveedorRepository;
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
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ProveedorController {

    private final ProveedorRepository proveedorRepository;

    public record ProveedorRequest(
            @NotBlank String documento,
            @NotBlank String razonSocial,
            String contacto,
            String telefono,
            String email
    ) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar proveedores")
    public List<Proveedor> listar() {
        return proveedorRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear proveedor")
    public Proveedor crear(@Valid @RequestBody ProveedorRequest req) {
        Proveedor p = new Proveedor();
        p.setDocumento(req.documento());
        p.setRazonSocial(req.razonSocial());
        p.setContacto(req.contacto());
        p.setTelefono(req.telefono());
        p.setEmail(req.email());
        p.setActivo(true);
        p.setCreatedAt(Instant.now());
        return proveedorRepository.save(p);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar proveedor")
    public Proveedor actualizar(@PathVariable Long id, @Valid @RequestBody ProveedorRequest req) {
        Proveedor p = proveedorRepository.findById(id).orElseThrow();
        p.setDocumento(req.documento());
        p.setRazonSocial(req.razonSocial());
        p.setContacto(req.contacto());
        p.setTelefono(req.telefono());
        p.setEmail(req.email());
        p.setUpdatedAt(Instant.now());
        return proveedorRepository.save(p);
    }
}

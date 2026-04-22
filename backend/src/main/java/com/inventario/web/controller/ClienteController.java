package com.inventario.web.controller;

import com.inventario.domain.entity.Cliente;
import com.inventario.service.catalog.ClienteCatalogService;
import com.inventario.web.dto.ClienteDtos.ClienteCreateRequest;
import com.inventario.web.dto.ClienteDtos.ClienteResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ClienteController {

    private final ClienteCatalogService clienteCatalogService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Catálogo ligero de clientes (activos, por empresa)")
    public Page<ClienteResponse> listar(Pageable pageable) {
        return clienteCatalogService.listar(pageable).map(this::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Detalle de cliente")
    public ClienteResponse obtener(@PathVariable Long id) {
        return toResponse(clienteCatalogService.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear cliente (catálogo mínimo para ventas)")
    public ClienteResponse crear(@Valid @RequestBody ClienteCreateRequest req) {
        Cliente c = clienteCatalogService.crear(req.nombre(), req.documento(), req.telefono(), req.email());
        return toResponse(c);
    }

    private ClienteResponse toResponse(Cliente c) {
        return new ClienteResponse(
                c.getId(),
                c.getNombre(),
                c.getDocumento(),
                c.getTelefono(),
                c.getEmail(),
                Boolean.TRUE.equals(c.getActivo()));
    }
}

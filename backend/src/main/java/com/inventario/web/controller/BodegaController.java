package com.inventario.web.controller;

import com.inventario.domain.entity.Bodega;
import com.inventario.domain.repository.BodegaRepository;
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
@RequestMapping("/api/v1/bodegas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class BodegaController {

    private final BodegaRepository bodegaRepository;

    public record BodegaRequest(@NotBlank String codigo, @NotBlank String nombre, String direccion) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Listar bodegas")
    public List<Bodega> listar() {
        return bodegaRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear bodega")
    public Bodega crear(@Valid @RequestBody BodegaRequest req) {
        Bodega b = new Bodega();
        b.setCodigo(req.codigo());
        b.setNombre(req.nombre());
        b.setDireccion(req.direccion());
        b.setActivo(true);
        b.setCreatedAt(Instant.now());
        return bodegaRepository.save(b);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar bodega")
    public Bodega actualizar(@PathVariable Long id, @Valid @RequestBody BodegaRequest req) {
        Bodega b = bodegaRepository.findById(id).orElseThrow();
        b.setCodigo(req.codigo());
        b.setNombre(req.nombre());
        b.setDireccion(req.direccion());
        b.setUpdatedAt(Instant.now());
        return bodegaRepository.save(b);
    }
}

package com.inventario.web.controller;

import com.inventario.domain.entity.Inventario;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.service.MovimientoService;
import com.inventario.web.dto.MovimientoDtos.StockInicialRequest;
import com.inventario.web.dto.MovimientoDtos.MovimientoResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class InventarioController {

    private final InventarioRepository inventarioRepository;
    private final MovimientoService movimientoService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Consulta de existencias")
    public Page<Inventario> listar(
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) Long bodegaId,
            Pageable pageable) {
        return inventarioRepository.buscar(productoId, bodegaId, pageable);
    }

    @GetMapping("/alertas")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Productos bajo stock mínimo")
    public List<Inventario> alertas(@RequestParam(required = false) Long bodegaId) {
        return inventarioRepository.findBajoMinimo(bodegaId);
    }

    @PostMapping("/stock-inicial")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Carga de stock inicial")
    public MovimientoResponse stockInicial(@Valid @RequestBody StockInicialRequest req) {
        return movimientoService.stockInicial(req);
    }
}

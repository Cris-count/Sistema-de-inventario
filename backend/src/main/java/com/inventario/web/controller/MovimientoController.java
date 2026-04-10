package com.inventario.web.controller;

import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.service.MovimientoService;
import com.inventario.web.dto.MovimientoDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/v1/movimientos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class MovimientoController {

    private final MovimientoService movimientoService;
    private final MovimientoRepository movimientoRepository;

    @PostMapping("/entradas")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS')")
    @Operation(summary = "Registrar entrada")
    public MovimientoResponse entrada(@Valid @RequestBody EntradaRequest req) {
        return movimientoService.registrarEntrada(req);
    }

    @PostMapping("/salidas")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA')")
    @Operation(summary = "Registrar salida")
    public MovimientoResponse salida(@Valid @RequestBody SalidaRequest req) {
        return movimientoService.registrarSalida(req);
    }

    @PostMapping("/transferencias")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA')")
    @Operation(summary = "Transferencia entre bodegas")
    public MovimientoResponse transferencia(@Valid @RequestBody TransferenciaRequest req) {
        return movimientoService.registrarTransferencia(req);
    }

    @PostMapping("/ajustes")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA')")
    @Operation(summary = "Ajuste de inventario / conteo")
    public MovimientoResponse ajuste(@Valid @RequestBody AjusteRequest req) {
        return movimientoService.registrarAjuste(req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Detalle de movimiento")
    public MovimientoResponse get(@PathVariable Long id) {
        return movimientoService.obtener(id);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Historial de movimientos")
    public Page<Movimiento> listar(
            @RequestParam(required = false) TipoMovimiento tipo,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            Pageable pageable) {
        Instant iDesde = desde.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant iHasta = hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return movimientoRepository.findByTipoAndFechaBetween(tipo, iDesde, iHasta, pageable);
    }
}

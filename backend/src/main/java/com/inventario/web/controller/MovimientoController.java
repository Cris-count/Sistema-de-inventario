package com.inventario.web.controller;

import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.service.CurrentUserService;
import com.inventario.service.MovimientoService;
import com.inventario.service.catalog.MovimientoConsultaService;
import com.inventario.time.ZonaNegocio;
import com.inventario.web.dto.MovimientoDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/movimientos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class MovimientoController {

    private final MovimientoService movimientoService;
    private final MovimientoConsultaService movimientoConsultaService;
    private final CurrentUserService currentUserService;

    @PostMapping("/entradas")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS')")
    @Operation(summary = "Registrar entrada")
    public MovimientoResponse entrada(@Valid @RequestBody EntradaRequest req) {
        return movimientoService.registrarEntrada(req);
    }

    @PostMapping("/salidas")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Registrar salida")
    public MovimientoResponse salida(@Valid @RequestBody SalidaRequest req) {
        return movimientoService.registrarSalida(req);
    }

    @PostMapping("/transferencias")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Transferencia entre bodegas")
    public MovimientoResponse transferencia(@Valid @RequestBody TransferenciaRequest req) {
        return movimientoService.registrarTransferencia(req);
    }

    @PostMapping("/ajustes")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA')")
    @Operation(summary = "Ajuste de inventario / conteo")
    public MovimientoResponse ajuste(@Valid @RequestBody AjusteRequest req) {
        return movimientoService.registrarAjuste(req);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Detalle de movimiento")
    public MovimientoResponse get(@PathVariable Long id) {
        Long empresaId = currentUserService.requireEmpresaId();
        return movimientoService.obtener(id, empresaId);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Historial de movimientos")
    public Page<MovimientoListItemResponse> listar(
            @RequestParam(required = false) TipoMovimiento tipo,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            Pageable pageable) {
        var iDesde = ZonaNegocio.inicioDiaInclusive(desde);
        var iHasta = ZonaNegocio.finRangoExclusivo(hasta);
        return movimientoConsultaService.listar(tipo, iDesde, iHasta, pageable);
    }
}

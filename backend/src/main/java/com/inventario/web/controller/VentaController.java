package com.inventario.web.controller;

import com.inventario.service.catalog.VentaService;
import com.inventario.web.dto.VentaDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/ventas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class VentaController {

    private final VentaService ventaService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Registrar venta (transaccional: venta, detalle, descuento de stock, movimiento SALIDA_POR_VENTA)")
    public VentaCreatedResponse crear(@Valid @RequestBody VentaCreateRequest req) {
        return ventaService.crear(req);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Historial de ventas (rol VENTAS: solo propias; filtros opcionales)")
    public Page<VentaListItemResponse> listar(
            Pageable pageable,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Long bodegaId,
            @RequestParam(required = false) Long usuarioVendedorId,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) String codigo) {
        return ventaService.listar(
                pageable, fechaDesde, fechaHasta, bodegaId, usuarioVendedorId, estado, clienteId, codigo);
    }

    @GetMapping("/resumen-operativo")
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Resumen operativo por rango (Fase 3): confirmadas vs anuladas, top productos, por vendedor y bodega")
    public VentaOperativoResumenResponse resumenOperativo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        return ventaService.resumenOperativo(fechaDesde, fechaHasta);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Export CSV del historial en un rango (mismos límites de visibilidad que el listado)")
    public ResponseEntity<byte[]> exportarCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta) {
        byte[] bytes = ventaService.exportarCsv(fechaDesde, fechaHasta);
        String nombre = "ventas_" + (fechaDesde != null ? fechaDesde : "desde") + "_" + (fechaHasta != null ? fechaHasta : "hasta") + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(nombre).build().toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(bytes);
    }

    @PostMapping("/{id}/anular")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Anula venta confirmada: revierte stock y marca movimiento ANULADO (solo administración)")
    public void anular(@PathVariable Long id) {
        ventaService.anular(id);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "Detalle de venta")
    public VentaDetailResponse obtener(@PathVariable Long id) {
        return ventaService.obtener(id);
    }

    @GetMapping("/panel-resumen")
    @PreAuthorize("hasAnyAuthority('VENTAS','ADMIN','SUPER_ADMIN','GERENCIA')")
    @Operation(summary = "KPIs del panel de ventas (hoy y últimos 7 días; solo ventas confirmadas; zona horaria Colombia)")
    public VentaPanelResumenResponse panelResumen() {
        return ventaService.resumenPanel();
    }
}

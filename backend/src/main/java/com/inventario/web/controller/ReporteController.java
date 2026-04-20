package com.inventario.web.controller;

import com.inventario.domain.entity.Movimiento;
import com.inventario.service.catalog.MovimientoConsultaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ReporteController {

    private final MovimientoConsultaService movimientoConsultaService;

    @GetMapping("/kardex")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Kardex por producto")
    public Page<Movimiento> kardex(
            @RequestParam Long productoId,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            Pageable pageable) {
        var iDesde = desde.atStartOfDay().toInstant(ZoneOffset.UTC);
        var iHasta = hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return movimientoConsultaService.kardex(productoId, iDesde, iHasta, pageable);
    }

    @GetMapping(value = "/movimientos/export", produces = "text/csv")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Export CSV simple de movimientos (MVP)")
    public ResponseEntity<byte[]> exportMovimientos(
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta) {
        var iDesde = desde.atStartOfDay().toInstant(ZoneOffset.UTC);
        var iHasta = hasta.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        var page = movimientoConsultaService.listarParaExportacion(null, iDesde, iHasta, Pageable.unpaged());
        StringBuilder sb = new StringBuilder("id,tipo,fecha,motivo,usuarioEmail\n");
        for (Movimiento m : page.getContent()) {
            sb.append(m.getId()).append(',')
                    .append(m.getTipoMovimiento()).append(',')
                    .append(m.getFechaMovimiento()).append(',')
                    .append(m.getMotivo() != null ? m.getMotivo() : "").append(',')
                    .append(m.getUsuario().getEmail()).append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("movimientos.csv").build().toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(bytes);
    }
}

package com.inventario.web.controller;

import com.inventario.domain.entity.Movimiento;
import com.inventario.service.catalog.MovimientoConsultaService;
import com.inventario.time.ZonaNegocio;
import com.inventario.web.dto.MovimientoDtos.KardexMovimientoResponse;
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

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class ReporteController {

    private final MovimientoConsultaService movimientoConsultaService;

    @GetMapping("/kardex")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Kardex por producto")
    public Page<KardexMovimientoResponse> kardex(
            @RequestParam Long productoId,
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta,
            Pageable pageable) {
        var iDesde = ZonaNegocio.inicioDiaInclusive(desde);
        var iHasta = ZonaNegocio.finRangoExclusivo(hasta);
        return movimientoConsultaService.kardex(productoId, iDesde, iHasta, pageable);
    }

    @GetMapping(value = "/movimientos/export", produces = "text/csv")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA','VENTAS')")
    @Operation(summary = "Export CSV simple de movimientos (MVP)")
    public ResponseEntity<byte[]> exportMovimientos(
            @RequestParam LocalDate desde,
            @RequestParam LocalDate hasta) {
        var iDesde = ZonaNegocio.inicioDiaInclusive(desde);
        var iHasta = ZonaNegocio.finRangoExclusivo(hasta);
        var page = movimientoConsultaService.listarParaExportacion(null, iDesde, iHasta, Pageable.unpaged());
        StringBuilder sb =
                new StringBuilder("id,tipo,estado,interpretacionStock,stockEfectivo,fecha,motivo,usuarioEmail\n");
        for (Movimiento m : page.getContent()) {
            sb.append(m.getId()).append(',')
                    .append(csvField(m.getTipoMovimiento().name())).append(',')
                    .append(csvField(m.getEstado().name())).append(',')
                    .append(csvField(MovimientoConsultaService.interpretacionStock(m.getEstado()))).append(',')
                    .append(m.getEstado().name().equals("COMPLETADO")).append(',')
                    .append(m.getFechaMovimiento()).append(',')
                    .append(csvField(m.getMotivo())).append(',')
                    .append(csvField(m.getUsuario() != null ? m.getUsuario().getEmail() : null)).append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("movimientos.csv").build().toString())
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(bytes);
    }

    private static String csvField(String s) {
        if (s == null) {
            return "\"\"";
        }
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }
}

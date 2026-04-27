package com.inventario.web.controller;

import com.inventario.security.JwtAuthenticationFilter;
import com.inventario.service.catalog.MovimientoConsultaService;
import com.inventario.web.dto.MovimientoDtos.KardexBodegaImpactoResponse;
import com.inventario.web.dto.MovimientoDtos.KardexMovimientoResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReporteController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReporteControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MovimientoConsultaService movimientoConsultaService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void kardexDebeRetornarDtoDeReporteSinGrafoMovimiento() throws Exception {
        KardexMovimientoResponse row = new KardexMovimientoResponse(
                44L,
                44L,
                "ENTRADA",
                "COMPLETADO",
                "COMPRA",
                "FAC-1",
                Instant.parse("2026-04-25T12:00:00Z"),
                9L,
                "admin@test.local",
                7L,
                "PRD-001",
                "Producto prueba",
                new BigDecimal("3"),
                List.of(new KardexBodegaImpactoResponse(null, null, 2L, "Principal", new BigDecimal("3"))),
                false,
                "Efectivo en stock");
        when(movimientoConsultaService.kardex(eq(7L), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(row)));

        mockMvc.perform(get("/api/v1/reportes/kardex")
                        .param("productoId", "7")
                        .param("desde", "2026-04-01")
                        .param("hasta", "2026-04-25"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content[0].movimientoId").value(44))
                .andExpect(jsonPath("$.content[0].productoId").value(7))
                .andExpect(jsonPath("$.content[0].productoCodigo").value("PRD-001"))
                .andExpect(jsonPath("$.content[0].cantidadMovimiento").value(3))
                .andExpect(jsonPath("$.content[0].interpretacionStock").value("Efectivo en stock"))
                .andExpect(jsonPath("$.content[0].bodegas[0].bodegaDestinoNombre").value("Principal"))
                .andExpect(jsonPath("$.content[0].detalles").doesNotExist())
                .andExpect(jsonPath("$.content[0].usuario").doesNotExist())
                .andExpect(jsonPath("$.content[0].empresa").doesNotExist())
                .andExpect(jsonPath("$.content[0].producto").doesNotExist());
    }
}

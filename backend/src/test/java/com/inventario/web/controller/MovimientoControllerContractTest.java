package com.inventario.web.controller;

import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.security.JwtAuthenticationFilter;
import com.inventario.service.CurrentUserService;
import com.inventario.service.MovimientoService;
import com.inventario.service.catalog.MovimientoConsultaService;
import com.inventario.web.dto.MovimientoDtos.MovimientoListItemResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MovimientoController.class)
@AutoConfigureMockMvc(addFilters = false)
class MovimientoControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MovimientoService movimientoService;

    @MockBean
    private MovimientoConsultaService movimientoConsultaService;

    @MockBean
    private CurrentUserService currentUserService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void historialDebeRetornarDtoPlanoSinGrafoJpa() throws Exception {
        MovimientoListItemResponse row = new MovimientoListItemResponse(
                31L,
                "ENTRADA",
                "COMPLETADO",
                "COMPRA",
                "FAC-1",
                "Obs",
                Instant.parse("2026-04-25T12:00:00Z"),
                9L,
                "admin@test.local",
                "Admin Test",
                21L,
                "Proveedor test",
                2,
                false,
                true,
                "Efectivo en stock");
        when(movimientoConsultaService.listar(eq(TipoMovimiento.ENTRADA), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(row)));

        mockMvc.perform(get("/api/v1/movimientos")
                        .param("desde", "2026-04-01")
                        .param("hasta", "2026-04-25")
                        .param("tipo", "ENTRADA"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content[0].id").value(31))
                .andExpect(jsonPath("$.content[0].tipoMovimiento").value("ENTRADA"))
                .andExpect(jsonPath("$.content[0].estado").value("COMPLETADO"))
                .andExpect(jsonPath("$.content[0].usuarioEmail").value("admin@test.local"))
                .andExpect(jsonPath("$.content[0].proveedorRazonSocial").value("Proveedor test"))
                .andExpect(jsonPath("$.content[0].totalLineas").value(2))
                .andExpect(jsonPath("$.content[0].interpretacionStock").value("Efectivo en stock"))
                .andExpect(jsonPath("$.content[0].usuario").doesNotExist())
                .andExpect(jsonPath("$.content[0].proveedor").doesNotExist())
                .andExpect(jsonPath("$.content[0].detalles").doesNotExist())
                .andExpect(jsonPath("$.content[0].empresa").doesNotExist())
                .andExpect(jsonPath("$.content[0].rol").doesNotExist());
    }
}

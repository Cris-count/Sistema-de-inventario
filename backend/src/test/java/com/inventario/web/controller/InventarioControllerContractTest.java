package com.inventario.web.controller;

import com.inventario.security.JwtAuthenticationFilter;
import com.inventario.service.CurrentUserService;
import com.inventario.service.MovimientoService;
import com.inventario.service.catalog.InventarioQueryService;
import com.inventario.service.inventory.AbastecimientoPanelService;
import com.inventario.service.inventory.PedidoProveedorMensajeService;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.InventarioDtos.InventarioRowResponse;
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

@WebMvcTest(controllers = InventarioController.class)
@AutoConfigureMockMvc(addFilters = false)
class InventarioControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private InventarioQueryService inventarioQueryService;

    @MockBean
    private MovimientoService movimientoService;

    @MockBean
    private PedidoProveedorMensajeService pedidoProveedorMensajeService;

    @MockBean
    private AbastecimientoPanelService abastecimientoPanelService;

    @MockBean
    private CurrentUserService currentUserService;

    @MockBean
    private PlanEntitlementService planEntitlementService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void listarInventarioDebeRetornarDtoPlanoSinGrafoJpa() throws Exception {
        InventarioRowResponse row = sampleRow();
        when(inventarioQueryService.buscar(eq(null), eq(null), any()))
                .thenReturn(new PageImpl<>(List.of(row)));

        mockMvc.perform(get("/api/v1/inventario"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content[0].productoId").value(7))
                .andExpect(jsonPath("$.content[0].productoCodigo").value("PRD-001"))
                .andExpect(jsonPath("$.content[0].productoNombre").value("Producto prueba"))
                .andExpect(jsonPath("$.content[0].bodegaId").value(3))
                .andExpect(jsonPath("$.content[0].bodegaNombre").value("Principal"))
                .andExpect(jsonPath("$.content[0].cantidad").value(4))
                .andExpect(jsonPath("$.content[0].stockMinimo").value(5))
                .andExpect(jsonPath("$.content[0].bajoMinimo").value(true))
                .andExpect(jsonPath("$.content[0].producto").doesNotExist())
                .andExpect(jsonPath("$.content[0].bodega").doesNotExist())
                .andExpect(jsonPath("$.content[0].empresa").doesNotExist())
                .andExpect(jsonPath("$.content[0].createdBy").doesNotExist())
                .andExpect(jsonPath("$.content[0].rol").doesNotExist());
    }

    @Test
    void alertasInventarioDebeRetornarListaDtoPlano() throws Exception {
        InventarioRowResponse row = sampleRow();
        when(inventarioQueryService.alertas(eq(null))).thenReturn(List.of(row));

        mockMvc.perform(get("/api/v1/inventario/alertas"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].productoId").value(7))
                .andExpect(jsonPath("$[0].bodegaCodigo").value("BOD-01"))
                .andExpect(jsonPath("$[0].producto").doesNotExist())
                .andExpect(jsonPath("$[0].bodega").doesNotExist())
                .andExpect(jsonPath("$[0].empresa").doesNotExist());
    }

    private static InventarioRowResponse sampleRow() {
        return new InventarioRowResponse(
                7L,
                "PRD-001",
                "Producto prueba",
                "UND",
                true,
                3L,
                "BOD-01",
                "Principal",
                new BigDecimal("4"),
                new BigDecimal("5"),
                true,
                Instant.parse("2026-04-25T12:00:00Z"));
    }
}

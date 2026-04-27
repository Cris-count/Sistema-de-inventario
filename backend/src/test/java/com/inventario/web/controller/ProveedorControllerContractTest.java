package com.inventario.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.security.JwtAuthenticationFilter;
import com.inventario.service.catalog.ProveedorCatalogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProveedorController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProveedorControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProveedorCatalogService proveedorCatalogService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void getProveedoresDebeRetornarListaJsonYSinCamposInternos() throws Exception {
        Proveedor proveedor = sampleProveedor();
        when(proveedorCatalogService.listar()).thenReturn(List.of(proveedor));

        mockMvc.perform(get("/api/v1/proveedores"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(proveedor.getId()))
                .andExpect(jsonPath("$[0].documento").value(proveedor.getDocumento()))
                .andExpect(jsonPath("$[0].razonSocial").value(proveedor.getRazonSocial()))
                .andExpect(jsonPath("$[0].activo").value(true))
                .andExpect(jsonPath("$[0].createdBy").doesNotExist())
                .andExpect(jsonPath("$[0].empresa").doesNotExist())
                .andExpect(jsonPath("$[0].rol").doesNotExist())
                .andExpect(jsonPath("$[0].updatedBy").doesNotExist());
    }

    @Test
    void postProveedorDebeRetornarContratoPlanoJson() throws Exception {
        Proveedor proveedor = sampleProveedor();
        when(proveedorCatalogService.crear(any(), any(), any(), any(), any())).thenReturn(proveedor);

        Map<String, Object> body = Map.of(
                "documento", "9001",
                "razonSocial", "Proveedor test",
                "contacto", "Ana",
                "telefono", "3001112233",
                "email", "proveedor@test.local"
        );

        mockMvc.perform(post("/api/v1/proveedores")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(proveedor.getId()))
                .andExpect(jsonPath("$.documento").value(proveedor.getDocumento()))
                .andExpect(jsonPath("$.razonSocial").value(proveedor.getRazonSocial()))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist())
                .andExpect(jsonPath("$.rol").doesNotExist());
    }

    @Test
    void putProveedorDebeRetornarContratoPlanoJson() throws Exception {
        Proveedor proveedor = sampleProveedor();
        when(proveedorCatalogService.actualizar(anyLong(), any(), any(), any(), any(), any())).thenReturn(proveedor);

        Map<String, Object> body = Map.of(
                "documento", "9001",
                "razonSocial", "Proveedor actualizado",
                "contacto", "Ana",
                "telefono", "3001112233",
                "email", "proveedor@test.local"
        );

        mockMvc.perform(put("/api/v1/proveedores/{id}", 21)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(proveedor.getId()))
                .andExpect(jsonPath("$.documento").value(proveedor.getDocumento()))
                .andExpect(jsonPath("$.razonSocial").value(proveedor.getRazonSocial()))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist())
                .andExpect(jsonPath("$.rol").doesNotExist());
    }

    private static Proveedor sampleProveedor() {
        Empresa empresa = new Empresa();
        empresa.setId(1L);
        empresa.setNombre("Empresa Test");
        empresa.setIdentificacion("TEST-001");
        empresa.setEstado(EstadoEmpresa.ACTIVA);
        empresa.setCreatedAt(Instant.now());

        Rol rol = new Rol();
        rol.setId(1L);
        rol.setCodigo("ADMIN");
        rol.setNombre("Administrador");
        rol.setCreatedAt(Instant.now());

        Usuario usuario = new Usuario();
        usuario.setId(99L);
        usuario.setEmail("admin@test.local");
        usuario.setNombre("Admin");
        usuario.setActivo(true);
        usuario.setEmpresa(empresa);
        usuario.setRol(rol);
        usuario.setCreatedAt(Instant.now());
        empresa.setUpdatedBy(usuario);

        Proveedor p = new Proveedor();
        p.setId(21L);
        p.setDocumento("9001");
        p.setRazonSocial("Proveedor test");
        p.setContacto("Ana");
        p.setTelefono("3001112233");
        p.setEmail("proveedor@test.local");
        p.setActivo(true);
        p.setEmpresa(empresa);
        p.setCreatedBy(usuario);
        p.setCreatedAt(Instant.now());
        return p;
    }
}


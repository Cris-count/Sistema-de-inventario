package com.inventario.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.Categoria;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.security.JwtAuthenticationFilter;
import com.inventario.service.catalog.ProductoCatalogService;
import com.inventario.service.catalog.ProductoCreacionService;
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
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ProductoController.class)
@AutoConfigureMockMvc(addFilters = false)
class ProductoControllerContractTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductoCatalogService productoCatalogService;

    @MockBean
    private ProductoCreacionService productoCreacionService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Test
    void getProductosDebeRetornarPaginaJsonYContratoPlano() throws Exception {
        Producto producto = sampleProducto();
        when(productoCatalogService.listar(any())).thenReturn(new PageImpl<>(List.of(producto)));

        mockMvc.perform(get("/api/v1/productos"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content[0].id").value(producto.getId()))
                .andExpect(jsonPath("$.content[0].codigo").value(producto.getCodigo()))
                .andExpect(jsonPath("$.content[0].nombre").value(producto.getNombre()))
                .andExpect(jsonPath("$.content[0].activo").value(true))
                .andExpect(jsonPath("$.content[0].stockMinimo").value(10))
                .andExpect(jsonPath("$.content[0].purchaseCost").value(7000))
                .andExpect(jsonPath("$.content[0].salePrice").value(10000))
                .andExpect(jsonPath("$.content[0].proveedorPreferidoId").value(producto.getProveedorPreferidoId()))
                .andExpect(jsonPath("$.content[0].categoria.id").value(producto.getCategoria().getId()))
                .andExpect(jsonPath("$.content[0].categoria.nombre").value(producto.getCategoria().getNombre()))
                .andExpect(jsonPath("$.content[0].createdBy").doesNotExist())
                .andExpect(jsonPath("$.content[0].empresa").doesNotExist())
                .andExpect(jsonPath("$.content[0].rol").doesNotExist())
                .andExpect(jsonPath("$.content[0].updatedBy").doesNotExist());
    }

    @Test
    void getProductoByIdDebeRetornarJsonSinGrafoInterno() throws Exception {
        Producto producto = sampleProducto();
        when(productoCatalogService.obtener(7L)).thenReturn(producto);

        mockMvc.perform(get("/api/v1/productos/{id}", 7))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(producto.getId()))
                .andExpect(jsonPath("$.codigo").value(producto.getCodigo()))
                .andExpect(jsonPath("$.purchaseCost").value(7000))
                .andExpect(jsonPath("$.salePrice").value(10000))
                .andExpect(jsonPath("$.categoria.id").value(producto.getCategoria().getId()))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist())
                .andExpect(jsonPath("$.rol").doesNotExist())
                .andExpect(jsonPath("$.updatedBy").doesNotExist());
    }

    @Test
    void postProductoDebeRetornarContratoPlanoJson() throws Exception {
        Producto producto = sampleProducto();
        when(productoCreacionService.crear(
                        any(), any(), any(), anyLong(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(producto);

        Map<String, Object> body = Map.of(
                "codigo", "PRD-001",
                "nombre", "Producto prueba",
                "descripcion", "Desc",
                "categoriaId", 11,
                "unidadMedida", "UND",
                "stockMinimo", 10,
                "purchaseCost", 7000,
                "salePrice", 10000,
                "proveedorPreferidoId", 21
        );

        mockMvc.perform(post("/api/v1/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(producto.getId()))
                .andExpect(jsonPath("$.codigo").value(producto.getCodigo()))
                .andExpect(jsonPath("$.categoria.nombre").value(producto.getCategoria().getNombre()))
                .andExpect(jsonPath("$.purchaseCost").value(7000))
                .andExpect(jsonPath("$.salePrice").value(10000))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist())
                .andExpect(jsonPath("$.rol").doesNotExist());
    }

    @Test
    void putProductoDebeRetornarContratoPlanoJson() throws Exception {
        Producto producto = sampleProducto();
        when(productoCatalogService.actualizar(anyLong(), any(), any(), any(), anyLong(), any(), any(), any(), any(), any())).thenReturn(producto);

        Map<String, Object> body = Map.of(
                "codigo", "PRD-001",
                "nombre", "Producto actualizado",
                "descripcion", "Desc",
                "categoriaId", 11,
                "unidadMedida", "UND",
                "stockMinimo", 10,
                "purchaseCost", 7000,
                "salePrice", 10000,
                "proveedorPreferidoId", 21
        );

        mockMvc.perform(put("/api/v1/productos/{id}", 7)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(producto.getId()))
                .andExpect(jsonPath("$.codigo").value(producto.getCodigo()))
                .andExpect(jsonPath("$.purchaseCost").value(7000))
                .andExpect(jsonPath("$.salePrice").value(10000))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist())
                .andExpect(jsonPath("$.updatedBy").doesNotExist());
    }

    @Test
    void patchProductoStockMinimoYEstadoMantienenContratoPlano() throws Exception {
        Producto producto = sampleProducto();
        when(productoCatalogService.actualizarStockMinimo(anyLong(), any())).thenReturn(producto);
        when(productoCatalogService.cambiarEstado(anyLong(), anyBoolean())).thenReturn(producto);

        mockMvc.perform(patch("/api/v1/productos/{id}/stock-minimo", 7)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("stockMinimo", 12))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(producto.getId()))
                .andExpect(jsonPath("$.stockMinimo").value(10))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist());

        mockMvc.perform(patch("/api/v1/productos/{id}/estado", 7)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("activo", true))))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(producto.getId()))
                .andExpect(jsonPath("$.activo").value(true))
                .andExpect(jsonPath("$.createdBy").doesNotExist())
                .andExpect(jsonPath("$.empresa").doesNotExist());
    }

    private static Producto sampleProducto() {
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

        Categoria categoria = new Categoria();
        categoria.setId(11L);
        categoria.setNombre("Categoría test");
        categoria.setDescripcion("desc");
        categoria.setActivo(true);

        Proveedor proveedor = new Proveedor();
        proveedor.setId(21L);
        proveedor.setDocumento("9001");
        proveedor.setRazonSocial("Proveedor test");
        proveedor.setActivo(true);

        Producto p = new Producto();
        p.setId(7L);
        p.setCodigo("PRD-001");
        p.setNombre("Producto prueba");
        p.setDescripcion("Desc");
        p.setCategoria(categoria);
        p.setUnidadMedida("UND");
        p.setStockMinimo(new BigDecimal("10"));
        p.setPurchaseCost(new BigDecimal("7000"));
        p.setSalePrice(new BigDecimal("10000"));
        p.setProveedorPreferido(proveedor);
        p.setActivo(true);
        p.setEmpresa(empresa);
        p.setCreatedBy(usuario);
        p.setCreatedAt(Instant.now());
        return p;
    }
}


package com.inventario.service.catalog;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Bodega;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.web.dto.VentaDtos.VentaCreateRequest;
import com.inventario.web.dto.VentaDtos.VentaLineRequest;
import com.inventario.web.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VentaPreparacionServiceTest {

    @Mock
    private TenantEntityLoader tenantEntityLoader;

    @InjectMocks
    private VentaPreparacionService service;

    @Test
    void prepararCentralizaValidacionCalculoDetallesYLineasStock() {
        Usuario usuario = usuario(SecurityRoles.ADMIN);
        Bodega bodega = bodega(3L);
        Producto producto = producto(7L);
        VentaCreateRequest req = new VentaCreateRequest(
                3L,
                null,
                "  mostrador  ",
                null,
                List.of(new VentaLineRequest(7L, new BigDecimal("2.5000"), new BigDecimal("1200.10"))));
        when(tenantEntityLoader.requireBodegaActiva(3L, 99L)).thenReturn(bodega);
        when(tenantEntityLoader.requireProductoActivo(7L, 99L)).thenReturn(producto);

        var preparada = service.preparar(usuario, 99L, req, false);

        assertThat(preparada.bodega()).isSameAs(bodega);
        assertThat(preparada.cliente()).isNull();
        assertThat(preparada.total()).isEqualByComparingTo("3000.25");
        assertThat(preparada.observacion()).isEqualTo("mostrador");
        assertThat(preparada.lineas()).hasSize(1);
        assertThat(service.lineasSalida(preparada)).singleElement().satisfies(linea -> {
            assertThat(linea.productoId()).isEqualTo(7L);
            assertThat(linea.bodegaOrigenId()).isEqualTo(3L);
            assertThat(linea.cantidad()).isEqualByComparingTo("2.5000");
        });
        verify(tenantEntityLoader).requireBodegaActiva(3L, 99L);
        verify(tenantEntityLoader).requireProductoActivo(7L, 99L);
    }

    @Test
    void prepararRechazaProductoRepetidoParaAmbosFlujos() {
        Usuario usuario = usuario(SecurityRoles.ADMIN);
        VentaCreateRequest req = new VentaCreateRequest(
                3L,
                null,
                null,
                null,
                List.of(
                        new VentaLineRequest(7L, BigDecimal.ONE, BigDecimal.TEN),
                        new VentaLineRequest(7L, BigDecimal.ONE, BigDecimal.TEN)));
        when(tenantEntityLoader.requireBodegaActiva(3L, 99L)).thenReturn(bodega(3L));
        when(tenantEntityLoader.requireProductoActivo(7L, 99L)).thenReturn(producto(7L));

        assertThatThrownBy(() -> service.preparar(usuario, 99L, req, false))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Producto repetido en la misma venta");
    }

    @Test
    void prepararMantienePoliticaPrecioCeroPorRolYTotalPositivoParaStripe() {
        Usuario vendedor = usuario(SecurityRoles.VENTAS);
        VentaCreateRequest precioCero = new VentaCreateRequest(
                3L,
                null,
                null,
                null,
                List.of(new VentaLineRequest(7L, BigDecimal.ONE, BigDecimal.ZERO)));
        when(tenantEntityLoader.requireBodegaActiva(3L, 99L)).thenReturn(bodega(3L));

        assertThatThrownBy(() -> service.preparar(vendedor, 99L, precioCero, true))
                .isInstanceOfSatisfying(BusinessException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).contains("Precio unitario 0 no permitido");
                });

        Usuario admin = usuario(SecurityRoles.ADMIN);
        assertThatThrownBy(() -> service.preparar(admin, 99L, precioCero, true))
                .isInstanceOfSatisfying(BusinessException.class, ex -> {
                    assertThat(ex.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(ex.getMessage()).isEqualTo("El total debe ser mayor a 0 para cobrar con tarjeta (Stripe).");
                });
    }

    private static Usuario usuario(String rolCodigo) {
        Empresa empresa = new Empresa();
        empresa.setId(99L);
        Rol rol = new Rol();
        rol.setCodigo(rolCodigo);
        Usuario usuario = new Usuario();
        usuario.setEmpresa(empresa);
        usuario.setRol(rol);
        return usuario;
    }

    private static Bodega bodega(Long id) {
        Bodega bodega = new Bodega();
        bodega.setId(id);
        return bodega;
    }

    private static Producto producto(Long id) {
        Producto producto = new Producto();
        producto.setId(id);
        return producto;
    }
}

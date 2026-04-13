package com.inventario.service.tenant;

import com.inventario.domain.entity.*;
import com.inventario.web.error.BusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.junit.jupiter.api.Assertions.*;

class TenantIntegrityServiceTest {

    private final TenantIntegrityService integrity = new TenantIntegrityService();

    @Test
    void productoYCategoriaDistintaEmpresa_lanzaConflict() {
        Empresa e1 = Empresa.builder().id(1L).nombre("A").identificacion("A-1").estado(EstadoEmpresa.ACTIVA).build();
        Empresa e2 = Empresa.builder().id(2L).nombre("B").identificacion("B-1").estado(EstadoEmpresa.ACTIVA).build();
        Categoria c = new Categoria();
        c.setEmpresa(e1);
        Producto p = new Producto();
        p.setEmpresa(e2);
        p.setCategoria(c);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> integrity.assertProductoAndCategoriaSameEmpresa(p, c));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void lineaMovimiento_bodegaOtroTenant_lanzaConflict() {
        Empresa em = Empresa.builder().id(10L).nombre("M").identificacion("M-1").estado(EstadoEmpresa.ACTIVA).build();
        Empresa eb = Empresa.builder().id(99L).nombre("X").identificacion("X-1").estado(EstadoEmpresa.ACTIVA).build();
        Movimiento m = new Movimiento();
        m.setEmpresa(em);
        Producto p = new Producto();
        p.setEmpresa(em);
        Bodega b = new Bodega();
        b.setEmpresa(eb);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> integrity.assertMovimientoLineCoherent(m, p, null, b));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void proveedorOtroTenant_lanzaConflict() {
        Empresa em = Empresa.builder().id(1L).nombre("M").identificacion("M-1").estado(EstadoEmpresa.ACTIVA).build();
        Empresa ep = Empresa.builder().id(2L).nombre("P").identificacion("P-1").estado(EstadoEmpresa.ACTIVA).build();
        Movimiento m = new Movimiento();
        m.setEmpresa(em);
        Proveedor pr = new Proveedor();
        pr.setEmpresa(ep);
        BusinessException ex = assertThrows(BusinessException.class,
                () -> integrity.assertProveedorMatchesMovimiento(m, pr));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }
}

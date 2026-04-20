package com.inventario;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.CategoriaRepository;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.tenant.TenantSpecifications;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Aislamiento de datos entre dos empresas en la misma base (H2 test).
 * <p>
 * Usa {@code ProductoRepository} a propósito para demostrar que {@code findByIdAndEmpresaId} no filtra
 * por error; en código de producción los controladores no inyectan repositorios de entidades con tenant
 * (ver {@code com.inventario.service.catalog}).
 */
@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@ActiveProfiles("test")
@Transactional
class MultiTenantIsolationIT {

    @Autowired
    private EmpresaRepository empresaRepository;
    @Autowired
    private CategoriaRepository categoriaRepository;
    @Autowired
    private ProductoRepository productoRepository;

    private Long empresaAId;
    private Long empresaBId;
    private Long productoEnAId;

    @BeforeEach
    void crearDosEmpresasYProductoEnA() {
        Empresa empA = empresaRepository.save(Empresa.builder()
                .nombre("Empresa A")
                .identificacion("ISOL-A-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        Empresa empB = empresaRepository.save(Empresa.builder()
                .nombre("Empresa B")
                .identificacion("ISOL-B-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        empresaAId = empA.getId();
        empresaBId = empB.getId();

        Categoria catA = new Categoria();
        catA.setEmpresa(empA);
        catA.setNombre("Cat A " + System.nanoTime());
        catA.setActivo(true);
        catA.setCreatedAt(Instant.now());
        catA = categoriaRepository.save(catA);

        Producto p = new Producto();
        p.setEmpresa(empA);
        p.setCodigo("P-A-" + System.nanoTime());
        p.setNombre("Producto A");
        p.setCategoria(catA);
        p.setUnidadMedida("UND");
        p.setStockMinimo(BigDecimal.ZERO);
        p.setActivo(true);
        p.setCreatedAt(Instant.now());
        productoEnAId = productoRepository.save(p).getId();
    }

    @Test
    void productoDeEmpresaA_noEsVisibleConFiltroEmpresaB() {
        assertTrue(productoRepository.findByIdAndEmpresaId(productoEnAId, empresaAId).isPresent());
        assertTrue(productoRepository.findByIdAndEmpresaId(productoEnAId, empresaBId).isEmpty());
    }

    @Test
    void productoGlobalPorId_existePeroConsultaPorTenantProtege() {
        assertTrue(productoRepository.findById(productoEnAId).isPresent());
        assertTrue(productoRepository.findByIdAndEmpresaId(productoEnAId, empresaBId).isEmpty());
    }

    @Test
    void specificationBelongsToEmpresa_noIncluyeProductoDeOtroTenant() {
        var pageB = productoRepository.findAll(TenantSpecifications.belongsToEmpresa(empresaBId), Pageable.unpaged());
        assertTrue(pageB.getContent().stream().noneMatch(p -> p.getId().equals(productoEnAId)));

        var pageA = productoRepository.findAll(TenantSpecifications.belongsToEmpresa(empresaAId), Pageable.unpaged());
        assertTrue(pageA.getContent().stream().anyMatch(p -> p.getId().equals(productoEnAId)));
    }
}

package com.inventario.service.catalog;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.tenant.TenantSpecifications;
import com.inventario.service.CurrentUserService;
import com.inventario.service.inventory.StockBajoEvaluarEvent;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.service.tenant.TenantIntegrityService;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ProductoCatalogService {

    private final ProductoRepository productoRepository;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;
    private final TenantIntegrityService tenantIntegrityService;
    private final PlanEntitlementService planEntitlementService;
    private final InventarioRepository inventarioRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public Page<Producto> listar(Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        return productoRepository.findAll(TenantSpecifications.belongsToEmpresa(empresaId), pageable);
    }

    @Transactional(readOnly = true)
    public Producto obtener(Long id) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        return tenantEntityLoader.requireProductoInTenant(id, empresaId);
    }

    @Transactional
    public Producto crear(String codigo, String nombre, String descripcion, Long categoriaId,
                          String unidadMedida, BigDecimal stockMinimo, BigDecimal costoProducto,
                          BigDecimal precioVenta, Long proveedorPreferidoId) {
        var empresa = currentUserService.requireEmpresa();
        Long empresaId = empresa.getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        planEntitlementService.assertPuedeCrearProducto(empresaId);
        String cod = codigo.trim();
        if (productoRepository.existsByEmpresaIdAndCodigo(empresaId, cod)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Código de producto ya existe en la empresa");
        }
        Categoria cat = tenantEntityLoader.requireCategoria(categoriaId, empresaId);
        Producto p = new Producto();
        p.setEmpresa(empresa);
        p.setCodigo(cod);
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setCategoria(cat);
        p.setUnidadMedida(unidadMedida != null ? unidadMedida : "UND");
        p.setStockMinimo(stockMinimo != null ? stockMinimo : BigDecimal.ZERO);
        p.setPurchaseCost(normalizeNonNegativeAmount(costoProducto, "El costo del producto no puede ser negativo"));
        p.setSalePrice(normalizeNonNegativeAmount(precioVenta, "El precio de venta no puede ser negativo"));
        aplicarProveedorPreferido(empresaId, p, proveedorPreferidoId);
        p.setActivo(true);
        p.setCreatedAt(Instant.now());
        p.setCreatedBy(currentUserService.requireUsuario());
        tenantIntegrityService.assertProductoAndCategoriaSameEmpresa(p, cat);
        return productoRepository.save(p);
    }

    @Transactional
    public Producto actualizar(Long id, String codigo, String nombre, String descripcion, Long categoriaId,
                               String unidadMedida, BigDecimal stockMinimo, BigDecimal costoProducto,
                               BigDecimal precioVenta, Long proveedorPreferidoId) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        Producto p = tenantEntityLoader.requireProductoInTenant(id, empresaId);
        String cod = codigo.trim();
        if (!p.getCodigo().equalsIgnoreCase(cod) && productoRepository.existsByEmpresaIdAndCodigo(empresaId, cod)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Código de producto ya existe en la empresa");
        }
        Categoria cat = tenantEntityLoader.requireCategoria(categoriaId, empresaId);
        p.setCodigo(cod);
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setCategoria(cat);
        p.setUnidadMedida(unidadMedida != null ? unidadMedida : p.getUnidadMedida());
        p.setStockMinimo(stockMinimo != null ? stockMinimo : p.getStockMinimo());
        p.setPurchaseCost(costoProducto != null
                ? normalizeNonNegativeAmount(costoProducto, "El costo del producto no puede ser negativo")
                : p.getPurchaseCost());
        p.setSalePrice(precioVenta != null
                ? normalizeNonNegativeAmount(precioVenta, "El precio de venta no puede ser negativo")
                : p.getSalePrice());
        aplicarProveedorPreferido(empresaId, p, proveedorPreferidoId);
        p.setUpdatedAt(Instant.now());
        tenantIntegrityService.assertProductoAndCategoriaSameEmpresa(p, cat);
        return productoRepository.save(p);
    }

    @Transactional
    public Producto actualizarStockMinimo(Long id, BigDecimal stockMinimo) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        Producto p = tenantEntityLoader.requireProductoInTenant(id, empresaId);
        p.setStockMinimo(stockMinimo);
        p.setUpdatedAt(Instant.now());
        productoRepository.save(p);
        for (Long bodegaId : inventarioRepository.findBodegaIdsByProductoId(id)) {
            eventPublisher.publishEvent(new StockBajoEvaluarEvent(empresaId, id, bodegaId));
        }
        return p;
    }

    private void aplicarProveedorPreferido(Long empresaId, Producto p, Long proveedorPreferidoId) {
        if (proveedorPreferidoId != null) {
            planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.PROVEEDORES);
            p.setProveedorPreferido(tenantEntityLoader.requireProveedorActivo(proveedorPreferidoId, empresaId));
        } else {
            p.setProveedorPreferido(null);
        }
    }

    @Transactional
    public Producto cambiarEstado(Long id, boolean activo) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.INVENTARIO_BASICO);
        Producto p = tenantEntityLoader.requireProductoInTenant(id, empresaId);
        p.setActivo(activo);
        p.setUpdatedAt(Instant.now());
        return productoRepository.save(p);
    }

    private static BigDecimal normalizeNonNegativeAmount(BigDecimal value, String errorMessage) {
        BigDecimal amount = value != null ? value : BigDecimal.ZERO;
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, errorMessage);
        }
        return amount;
    }
}

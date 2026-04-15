package com.inventario.service.catalog;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.repository.CategoriaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.service.tenant.TenantEntityLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaCatalogService {

    private final CategoriaRepository categoriaRepository;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public List<Categoria> listar() {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CATEGORIAS);
        return categoriaRepository.findByEmpresaIdOrderByNombreAsc(empresaId);
    }

    @Transactional
    public Categoria crear(String nombre, String descripcion) {
        var empresa = currentUserService.requireEmpresa();
        planEntitlementService.requireModulo(empresa.getId(), PlanEntitlementCodes.CATEGORIAS);
        Categoria c = new Categoria();
        c.setEmpresa(empresa);
        c.setNombre(nombre);
        c.setDescripcion(descripcion);
        c.setActivo(true);
        c.setCreatedAt(Instant.now());
        c.setCreatedBy(currentUserService.requireUsuario());
        return categoriaRepository.save(c);
    }

    @Transactional
    public Categoria actualizar(Long id, String nombre, String descripcion) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CATEGORIAS);
        Categoria c = tenantEntityLoader.requireCategoria(id, empresaId);
        c.setNombre(nombre);
        c.setDescripcion(descripcion);
        c.setUpdatedAt(Instant.now());
        return categoriaRepository.save(c);
    }
}

package com.inventario.service.catalog;

import com.inventario.domain.entity.Categoria;
import com.inventario.domain.repository.CategoriaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.web.error.ApiErrorMessages;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
        String nombreNorm = normalizeNombre(nombre);
        if (nombreNorm.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio");
        }
        if (categoriaRepository.existsByEmpresaIdAndNombreNormalized(empresa.getId(), nombreNorm)) {
            throw BusinessException.conflictWithCode(
                    ApiErrorMessages.CATEGORY_ALREADY_EXISTS_DETAIL, ApiErrorMessages.CATEGORY_ALREADY_EXISTS_CODE);
        }
        Categoria c = new Categoria();
        c.setEmpresa(empresa);
        c.setNombre(nombreNorm);
        c.setDescripcion(normalizeDescripcion(descripcion));
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
        String nombreNorm = normalizeNombre(nombre);
        if (nombreNorm.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio");
        }
        if (categoriaRepository.existsByEmpresaIdAndNombreNormalizedExcluding(empresaId, nombreNorm, id)) {
            throw BusinessException.conflictWithCode(
                    ApiErrorMessages.CATEGORY_ALREADY_EXISTS_DETAIL, ApiErrorMessages.CATEGORY_ALREADY_EXISTS_CODE);
        }
        c.setNombre(nombreNorm);
        c.setDescripcion(normalizeDescripcion(descripcion));
        c.setUpdatedAt(Instant.now());
        return categoriaRepository.save(c);
    }

    /** Trim y espacios internos colapsados; la comparación de duplicados es case-insensitive vía repositorio. */
    private static String normalizeNombre(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().replaceAll("\\s+", " ");
    }

    private static String normalizeDescripcion(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String t = raw.trim().replaceAll("\\s+", " ");
        return t.isEmpty() ? null : t;
    }
}

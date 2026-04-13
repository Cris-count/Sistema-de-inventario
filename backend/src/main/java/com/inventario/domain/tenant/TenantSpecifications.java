package com.inventario.domain.tenant;

import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

/**
 * Especificaciones JPA reutilizables para entidades con asociación {@code empresa}.
 * Complementa los métodos derivados {@code findBy…EmpresaId} sin sustituirlos por completo:
 * útil para listados paginados y consultas dinámicas futuras.
 */
public final class TenantSpecifications {

    private TenantSpecifications() {}

    /** Entidad raíz debe tener relación {@code empresa} con {@code id} igual al tenant. */
    public static <T> Specification<T> belongsToEmpresa(Long empresaId) {
        return (root, query, cb) ->
                cb.equal(root.join("empresa", JoinType.INNER).get("id"), empresaId);
    }
}

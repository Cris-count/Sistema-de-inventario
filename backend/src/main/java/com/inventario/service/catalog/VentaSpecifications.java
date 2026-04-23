package com.inventario.service.catalog;

import com.inventario.domain.entity.Venta;
import com.inventario.domain.entity.VentaEstado;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public final class VentaSpecifications {

    private VentaSpecifications() {}

    public static Specification<Venta> filtrar(
            Long empresaId,
            Long usuarioObligatorioVentas,
            Instant fechaDesde,
            Instant fechaHastaExclusivo,
            Long bodegaId,
            Long usuarioVendedorId,
            VentaEstado estado,
            Long clienteId,
            String codigoContiene) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("empresa").get("id"), empresaId));

            if (usuarioObligatorioVentas != null) {
                p.add(cb.equal(root.get("usuario").get("id"), usuarioObligatorioVentas));
            } else if (usuarioVendedorId != null) {
                p.add(cb.equal(root.get("usuario").get("id"), usuarioVendedorId));
            }

            if (fechaDesde != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("fechaVenta"), fechaDesde));
            }
            if (fechaHastaExclusivo != null) {
                p.add(cb.lessThan(root.get("fechaVenta"), fechaHastaExclusivo));
            }
            if (bodegaId != null) {
                p.add(cb.equal(root.get("bodega").get("id"), bodegaId));
            }
            if (estado != null) {
                p.add(cb.equal(root.get("estado"), estado));
            }
            if (clienteId != null) {
                p.add(cb.equal(root.join("cliente", JoinType.INNER).get("id"), clienteId));
            }
            if (codigoContiene != null && !codigoContiene.isBlank()) {
                String like = "%" + codigoContiene.trim().toUpperCase() + "%";
                p.add(cb.like(cb.upper(root.get("codigoPublico")), like));
            }

            return cb.and(p.toArray(Predicate[]::new));
        };
    }
}

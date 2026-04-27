package com.inventario.service.catalog;

import com.inventario.domain.entity.Inventario;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.InventarioDtos.InventarioRowResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioQueryService {

    private final InventarioRepository inventarioRepository;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public Page<InventarioRowResponse> buscar(Long productoId, Long bodegaId, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        return inventarioRepository.buscarPorEmpresa(empresaId, productoId, bodegaId, pageable)
                .map(this::toRow);
    }

    @Transactional(readOnly = true)
    public List<InventarioRowResponse> alertas(Long bodegaId) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        return inventarioRepository.findBajoMinimoPorEmpresa(empresaId, bodegaId).stream()
                .map(this::toRow)
                .toList();
    }

    private InventarioRowResponse toRow(Inventario i) {
        var p = i.getProducto();
        var b = i.getBodega();
        var stockMinimo = p.getStockMinimo();
        boolean bajoMinimo = stockMinimo != null && i.getCantidad().compareTo(stockMinimo) <= 0;
        return new InventarioRowResponse(
                p.getId(),
                p.getCodigo(),
                p.getNombre(),
                p.getUnidadMedida(),
                Boolean.TRUE.equals(p.getActivo()),
                b.getId(),
                b.getCodigo(),
                b.getNombre(),
                i.getCantidad(),
                stockMinimo,
                bajoMinimo,
                i.getUpdatedAt());
    }
}

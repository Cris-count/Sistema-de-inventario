package com.inventario.service.catalog;

import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class MovimientoConsultaService {

    private final MovimientoRepository movimientoRepository;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public Page<Movimiento> listar(TipoMovimiento tipo, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.HISTORIAL_MOVIMIENTOS);
        return movimientoRepository.findByEmpresaAndTipoAndFechaBetween(empresaId, tipo, desde, hasta, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Movimiento> kardex(Long productoId, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireReporte(empresaId);
        return movimientoRepository.findKardexByEmpresaAndProducto(empresaId, productoId, desde, hasta, pageable);
    }

    /** Exportación CSV: exige módulo de reportes, no el de historial en pantalla. */
    @Transactional(readOnly = true)
    public Page<Movimiento> listarParaExportacion(TipoMovimiento tipo, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireReporte(empresaId);
        return movimientoRepository.findByEmpresaAndTipoAndFechaBetween(empresaId, tipo, desde, hasta, pageable);
    }
}

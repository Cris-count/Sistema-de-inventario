package com.inventario.service.catalog;

import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.service.CurrentUserService;
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

    @Transactional(readOnly = true)
    public Page<Movimiento> listar(TipoMovimiento tipo, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        return movimientoRepository.findByEmpresaAndTipoAndFechaBetween(empresaId, tipo, desde, hasta, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Movimiento> kardex(Long productoId, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        return movimientoRepository.findKardexByEmpresaAndProducto(empresaId, productoId, desde, hasta, pageable);
    }
}

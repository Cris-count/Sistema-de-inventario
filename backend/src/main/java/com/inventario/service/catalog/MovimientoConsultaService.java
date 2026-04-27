package com.inventario.service.catalog;

import com.inventario.domain.entity.EstadoMovimiento;
import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.MovimientoDetalle;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.MovimientoDtos.KardexBodegaImpactoResponse;
import com.inventario.web.dto.MovimientoDtos.KardexMovimientoResponse;
import com.inventario.web.dto.MovimientoDtos.MovimientoListItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoConsultaService {

    private final MovimientoRepository movimientoRepository;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public Page<MovimientoListItemResponse> listar(TipoMovimiento tipo, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.HISTORIAL_MOVIMIENTOS);
        return movimientoRepository.findByEmpresaAndTipoAndFechaBetween(empresaId, tipo, desde, hasta, pageable)
                .map(this::toListItem);
    }

    @Transactional(readOnly = true)
    public Page<KardexMovimientoResponse> kardex(Long productoId, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireReporte(empresaId);
        return movimientoRepository.findKardexByEmpresaAndProducto(empresaId, productoId, desde, hasta, pageable)
                .map(m -> toKardexItem(m, productoId));
    }

    /** Exportación CSV: exige módulo de reportes, no el de historial en pantalla. */
    @Transactional(readOnly = true)
    public Page<Movimiento> listarParaExportacion(TipoMovimiento tipo, Instant desde, Instant hasta, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireReporte(empresaId);
        return movimientoRepository.findByEmpresaAndTipoAndFechaBetween(empresaId, tipo, desde, hasta, pageable);
    }

    private MovimientoListItemResponse toListItem(Movimiento m) {
        var usuario = m.getUsuario();
        var proveedor = m.getProveedor();
        boolean anulado = m.getEstado() == EstadoMovimiento.ANULADO;
        boolean completado = m.getEstado() == EstadoMovimiento.COMPLETADO;
        return new MovimientoListItemResponse(
                m.getId(),
                m.getTipoMovimiento().name(),
                m.getEstado().name(),
                m.getMotivo(),
                m.getReferenciaDocumento(),
                m.getObservacion(),
                m.getFechaMovimiento(),
                usuario != null ? usuario.getId() : null,
                usuario != null ? usuario.getEmail() : null,
                formatoNombreUsuario(usuario),
                proveedor != null ? proveedor.getId() : null,
                proveedor != null ? proveedor.getRazonSocial() : null,
                m.getDetalles() != null ? m.getDetalles().size() : 0,
                anulado,
                completado,
                interpretacionStock(m.getEstado()));
    }

    private KardexMovimientoResponse toKardexItem(Movimiento m, Long productoId) {
        List<MovimientoDetalle> matching = m.getDetalles().stream()
                .filter(d -> d.getProducto() != null && d.getProducto().getId().equals(productoId))
                .toList();
        MovimientoDetalle first = matching.isEmpty() ? null : matching.get(0);
        BigDecimal cantidad = matching.stream()
                .map(MovimientoDetalle::getCantidad)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<KardexBodegaImpactoResponse> bodegas = matching.stream()
                .map(d -> new KardexBodegaImpactoResponse(
                        d.getBodegaOrigen() != null ? d.getBodegaOrigen().getId() : null,
                        d.getBodegaOrigen() != null ? d.getBodegaOrigen().getNombre() : null,
                        d.getBodegaDestino() != null ? d.getBodegaDestino().getId() : null,
                        d.getBodegaDestino() != null ? d.getBodegaDestino().getNombre() : null,
                        d.getCantidad()))
                .toList();
        var usuario = m.getUsuario();
        return new KardexMovimientoResponse(
                m.getId(),
                m.getId(),
                m.getTipoMovimiento().name(),
                m.getEstado().name(),
                m.getMotivo(),
                m.getReferenciaDocumento(),
                m.getFechaMovimiento(),
                usuario != null ? usuario.getId() : null,
                usuario != null ? usuario.getEmail() : null,
                first != null ? first.getProducto().getId() : productoId,
                first != null ? first.getProducto().getCodigo() : null,
                first != null ? first.getProducto().getNombre() : null,
                cantidad,
                bodegas,
                m.getEstado() == EstadoMovimiento.ANULADO,
                interpretacionStock(m.getEstado()));
    }

    public static String interpretacionStock(EstadoMovimiento estado) {
        if (estado == EstadoMovimiento.ANULADO) {
            return "Histórico: stock revertido; no representa efecto vigente";
        }
        if (estado == EstadoMovimiento.COMPLETADO) {
            return "Efectivo en stock";
        }
        return "Sin efecto vigente hasta completar";
    }

    private static String formatoNombreUsuario(com.inventario.domain.entity.Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        String nombre = usuario.getNombre() != null ? usuario.getNombre().trim() : "";
        String apellido = usuario.getApellido() != null ? usuario.getApellido().trim() : "";
        if (!nombre.isEmpty() && !apellido.isEmpty()) {
            return nombre + " " + apellido;
        }
        if (!nombre.isEmpty()) {
            return nombre;
        }
        if (!apellido.isEmpty()) {
            return apellido;
        }
        return usuario.getEmail();
    }
}

package com.inventario.service;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.web.dto.MovimientoDtos.*;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final ProveedorRepository proveedorRepository;
    private final InventarioRepository inventarioRepository;
    private final CurrentUserService currentUserService;

    @Transactional
    public MovimientoResponse registrarEntrada(EntradaRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        if ("COMPRA".equalsIgnoreCase(req.motivo()) && req.proveedorId() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Proveedor obligatorio para motivo COMPRA");
        }
        Proveedor proveedor = null;
        if (req.proveedorId() != null) {
            proveedor = proveedorRepository.findById(req.proveedorId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));
            if (!proveedor.getActivo()) {
                throw new BusinessException(HttpStatus.CONFLICT, "Proveedor inactivo");
            }
        }

        Movimiento m = baseCabecera(TipoMovimiento.ENTRADA, req.motivo(), usuario, proveedor, req.referenciaDocumento(), req.observacion());

        for (LineaEntrada linea : req.lineas()) {
            Producto p = cargarProductoActivo(linea.productoId());
            Bodega b = cargarBodegaActiva(linea.bodegaDestinoId());
            sumarStock(p.getId(), b.getId(), linea.cantidad());
            agregarDetalle(m, p, linea.cantidad(), null, b);
        }
        movimientoRepository.save(m);
        return toResponse(m);
    }

    @Transactional
    public MovimientoResponse registrarSalida(SalidaRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Movimiento m = baseCabecera(TipoMovimiento.SALIDA, req.motivo(), usuario, null, req.referenciaDocumento(), req.observacion());

        for (LineaSalida linea : req.lineas()) {
            Producto p = cargarProductoActivo(linea.productoId());
            Bodega b = cargarBodegaActiva(linea.bodegaOrigenId());
            restarStock(p.getId(), b.getId(), linea.cantidad());
            agregarDetalle(m, p, linea.cantidad(), b, null);
        }
        movimientoRepository.save(m);
        return toResponse(m);
    }

    @Transactional
    public MovimientoResponse registrarTransferencia(TransferenciaRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Movimiento m = baseCabecera(TipoMovimiento.TRANSFERENCIA, "TRANSFERENCIA", usuario, null, req.referenciaDocumento(), req.observacion());

        for (LineaTransferencia linea : req.lineas()) {
            if (linea.bodegaOrigenId().equals(linea.bodegaDestinoId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Origen y destino deben ser distintos");
            }
            Producto p = cargarProductoActivo(linea.productoId());
            Bodega origen = cargarBodegaActiva(linea.bodegaOrigenId());
            Bodega destino = cargarBodegaActiva(linea.bodegaDestinoId());
            restarStock(p.getId(), origen.getId(), linea.cantidad());
            sumarStock(p.getId(), destino.getId(), linea.cantidad());
            MovimientoDetalle d = new MovimientoDetalle();
            d.setMovimiento(m);
            d.setProducto(p);
            d.setCantidad(linea.cantidad());
            d.setBodegaOrigen(origen);
            d.setBodegaDestino(destino);
            m.getDetalles().add(d);
        }
        movimientoRepository.save(m);
        return toResponse(m);
    }

    @Transactional
    public MovimientoResponse registrarAjuste(AjusteRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Movimiento m = baseCabecera(TipoMovimiento.AJUSTE, req.motivo(), usuario, null, req.referenciaDocumento(), null);

        for (LineaAjuste linea : req.lineas()) {
            boolean tieneOrigen = linea.bodegaOrigenId() != null;
            boolean tieneDestino = linea.bodegaDestinoId() != null;
            if (tieneOrigen == tieneDestino) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cada línea de ajuste debe tener solo bodega origen o solo bodega destino");
            }
            Producto p = cargarProductoActivo(linea.productoId());
            if (tieneDestino) {
                Bodega b = cargarBodegaActiva(linea.bodegaDestinoId());
                sumarStock(p.getId(), b.getId(), linea.cantidad());
                agregarDetalle(m, p, linea.cantidad(), null, b);
            } else {
                Bodega b = cargarBodegaActiva(linea.bodegaOrigenId());
                restarStock(p.getId(), b.getId(), linea.cantidad());
                agregarDetalle(m, p, linea.cantidad(), b, null);
            }
        }
        movimientoRepository.save(m);
        return toResponse(m);
    }

    @Transactional
    public MovimientoResponse stockInicial(StockInicialRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Movimiento m = baseCabecera(TipoMovimiento.ENTRADA, "STOCK_INICIAL", usuario, null, null, null);

        for (LineaStockInicial linea : req.lineas()) {
            if (linea.cantidad().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Cantidad inicial debe ser > 0");
            }
            Producto p = cargarProductoActivo(linea.productoId());
            Bodega b = cargarBodegaActiva(linea.bodegaId());
            BigDecimal actual = inventarioRepository
                    .findById(new InventarioId(p.getId(), b.getId()))
                    .map(Inventario::getCantidad)
                    .orElse(BigDecimal.ZERO);
            if (actual.compareTo(BigDecimal.ZERO) > 0) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "Ya existe stock para producto " + p.getCodigo() + " en la bodega indicada; use ajuste");
            }
            sumarStock(p.getId(), b.getId(), linea.cantidad());
            MovimientoDetalle d = new MovimientoDetalle();
            d.setMovimiento(m);
            d.setProducto(p);
            d.setCantidad(linea.cantidad());
            d.setBodegaDestino(b);
            if (linea.referencia() != null) {
                m.setReferenciaDocumento(linea.referencia());
            }
            m.getDetalles().add(d);
        }
        movimientoRepository.save(m);
        return toResponse(m);
    }

    private Movimiento baseCabecera(TipoMovimiento tipo, String motivo, Usuario usuario, Proveedor proveedor,
                                    String ref, String obs) {
        Movimiento m = new Movimiento();
        m.setTipoMovimiento(tipo);
        m.setMotivo(motivo);
        m.setFechaMovimiento(Instant.now());
        m.setUsuario(usuario);
        m.setProveedor(proveedor);
        m.setReferenciaDocumento(ref);
        m.setObservacion(obs);
        m.setEstado(EstadoMovimiento.COMPLETADO);
        m.setCreatedAt(Instant.now());
        m.setDetalles(new ArrayList<>());
        return m;
    }

    private Producto cargarProductoActivo(Long id) {
        Producto p = productoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
        if (!p.getActivo()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Producto inactivo");
        }
        return p;
    }

    private Bodega cargarBodegaActiva(Long id) {
        Bodega b = bodegaRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bodega no encontrada"));
        if (!b.getActivo()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Bodega inactiva");
        }
        return b;
    }

    private void agregarDetalle(Movimiento m, Producto p, BigDecimal qty, Bodega origen, Bodega destino) {
        MovimientoDetalle d = new MovimientoDetalle();
        d.setMovimiento(m);
        d.setProducto(p);
        d.setCantidad(qty);
        d.setBodegaOrigen(origen);
        d.setBodegaDestino(destino);
        m.getDetalles().add(d);
    }

    private void sumarStock(Long productoId, Long bodegaId, BigDecimal qty) {
        var opt = inventarioRepository.findForUpdate(productoId, bodegaId);
        if (opt.isEmpty()) {
            Inventario inv = new Inventario();
            inv.setId(new InventarioId(productoId, bodegaId));
            inv.setProducto(productoRepository.getReferenceById(productoId));
            inv.setBodega(bodegaRepository.getReferenceById(bodegaId));
            inv.setCantidad(qty);
            inv.setUpdatedAt(Instant.now());
            inventarioRepository.save(inv);
        } else {
            Inventario inv = opt.get();
            inv.setCantidad(inv.getCantidad().add(qty));
            inv.setUpdatedAt(Instant.now());
        }
    }

    private void restarStock(Long productoId, Long bodegaId, BigDecimal qty) {
        Inventario inv = inventarioRepository.findForUpdate(productoId, bodegaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.CONFLICT, "Sin existencias en bodega"));
        if (inv.getCantidad().compareTo(qty) < 0) {
            throw new BusinessException(HttpStatus.CONFLICT, "Stock insuficiente");
        }
        inv.setCantidad(inv.getCantidad().subtract(qty));
        inv.setUpdatedAt(Instant.now());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public MovimientoResponse obtener(Long id) {
        Movimiento m = movimientoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(org.springframework.http.HttpStatus.NOT_FOUND, "Movimiento no encontrado"));
        return toResponse(m);
    }

    private MovimientoResponse toResponse(Movimiento m) {
        List<DetalleResponse> detalles = m.getDetalles().stream()
                .map(d -> new DetalleResponse(
                        d.getId(),
                        d.getProducto().getId(),
                        d.getProducto().getCodigo(),
                        d.getCantidad(),
                        d.getBodegaOrigen() != null ? d.getBodegaOrigen().getId() : null,
                        d.getBodegaDestino() != null ? d.getBodegaDestino().getId() : null
                ))
                .toList();
        return new MovimientoResponse(
                m.getId(),
                m.getTipoMovimiento().name(),
                m.getMotivo(),
                m.getReferenciaDocumento(),
                m.getEstado().name(),
                detalles
        );
    }
}

package com.inventario.service.catalog;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Bodega;
import com.inventario.domain.entity.Cliente;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.entity.Venta;
import com.inventario.domain.entity.VentaDetalle;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.web.dto.MovimientoDtos.LineaSalida;
import com.inventario.web.dto.VentaDtos.VentaCreateRequest;
import com.inventario.web.dto.VentaDtos.VentaLineRequest;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Shared sale preparation rules used by immediate sales and POS/Stripe sales.
 * Flow-specific services still own when inventory movement and payment confirmation happen.
 */
@Service
@RequiredArgsConstructor
public class VentaPreparacionService {

    private final TenantEntityLoader tenantEntityLoader;

    public VentaPreparada preparar(Usuario usuario, Long empresaId, VentaCreateRequest req, boolean requirePositiveTotal) {
        Bodega bodega = tenantEntityLoader.requireBodegaActiva(req.bodegaId(), empresaId);
        if (req.lineas() == null || req.lineas().isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La venta debe tener al menos una línea");
        }
        assertPoliticaPrecioCero(usuario, req.lineas());

        Cliente cliente = null;
        if (req.clienteId() != null) {
            cliente = tenantEntityLoader.requireClienteActivo(req.clienteId(), empresaId);
        }

        Set<Long> productosVistos = new HashSet<>();
        List<LineaVentaPreparada> lineasVenta = new ArrayList<>();
        for (VentaLineRequest line : req.lineas()) {
            if (!productosVistos.add(line.productoId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Producto repetido en la misma venta");
            }
            Producto p = tenantEntityLoader.requireProductoActivo(line.productoId(), empresaId);
            BigDecimal subtotal = line.cantidad().multiply(line.precioUnitario()).setScale(2, RoundingMode.HALF_UP);
            lineasVenta.add(new LineaVentaPreparada(p, line.cantidad(), line.precioUnitario(), subtotal));
        }

        BigDecimal total = lineasVenta.stream()
                .map(LineaVentaPreparada::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        if (requirePositiveTotal && total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST, "El total debe ser mayor a 0 para cobrar con tarjeta (Stripe).");
        }

        return new VentaPreparada(bodega, cliente, lineasVenta, total, normalizeObs(req.observacion()));
    }

    public void agregarDetalles(Venta venta, VentaPreparada preparada) {
        for (LineaVentaPreparada lv : preparada.lineas()) {
            VentaDetalle d = new VentaDetalle();
            d.setVenta(venta);
            d.setProducto(lv.producto());
            d.setCantidad(lv.cantidad());
            d.setPrecioUnitario(lv.precioUnitario().setScale(2, RoundingMode.HALF_UP));
            d.setSubtotal(lv.subtotal());
            venta.getDetalles().add(d);
        }
    }

    public List<LineaSalida> lineasSalida(VentaPreparada preparada) {
        return preparada.lineas().stream()
                .map(linea -> new LineaSalida(linea.producto().getId(), preparada.bodega().getId(), linea.cantidad()))
                .toList();
    }

    public List<LineaSalida> lineasSalidaDesdeVenta(Venta venta) {
        Long bodegaId = venta.getBodega().getId();
        return venta.getDetalles().stream()
                .map(d -> new LineaSalida(d.getProducto().getId(), bodegaId, d.getCantidad()))
                .toList();
    }

    private void assertPoliticaPrecioCero(Usuario usuario, List<VentaLineRequest> lineas) {
        String rol = SecurityRoles.canonicalCodigo(usuario.getRol().getCodigo());
        boolean admin = SecurityRoles.ADMIN.equals(rol) || SecurityRoles.SUPER_ADMIN.equals(rol);
        if (admin) {
            return;
        }
        for (VentaLineRequest line : lineas) {
            if (line.precioUnitario().compareTo(BigDecimal.ZERO) == 0) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST,
                        "Precio unitario 0 no permitido para su rol. Indique un precio mayor a 0 o solicite a un administrador.");
            }
        }
    }

    private static String normalizeObs(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public record VentaPreparada(
            Bodega bodega,
            Cliente cliente,
            List<LineaVentaPreparada> lineas,
            BigDecimal total,
            String observacion
    ) {}

    public record LineaVentaPreparada(
            Producto producto,
            BigDecimal cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal
    ) {}
}

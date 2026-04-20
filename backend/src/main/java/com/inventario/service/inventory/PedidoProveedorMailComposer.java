package com.inventario.service.inventory;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.Producto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PedidoProveedorMailComposer {

    private static final BigDecimal DEFAULT_SIN_TOPE = new BigDecimal("999999");

    public MailPedidoSugerido buildSugerido(Inventario inv, Producto producto) {
        Empresa empresa = producto.getEmpresa();
        BigDecimal cantidad = inv.getCantidad();
        BigDecimal stockMinimo = producto.getStockMinimo();
        BigDecimal tope = resolverTope(empresa);
        BigDecimal sugerida = calcularSugerida(cantidad, stockMinimo, tope);
        return new MailPedidoSugerido(
                "[Inventario] Pedido sugerido: " + producto.getCodigo() + " — " + empresa.getNombre(),
                cuerpoComun(empresa, inv, producto, cantidad, stockMinimo, tope, sugerida),
                sugerida);
    }

    /**
     * Correo con la cantidad que el administrador autorizó (puede diferir de la sugerida por el sistema).
     */
    public MailPedidoSugerido buildConCantidadAdministrador(
            Inventario inv, Producto producto, BigDecimal cantidadParaProveedor) {
        Empresa empresa = producto.getEmpresa();
        BigDecimal cantidad = inv.getCantidad();
        BigDecimal stockMinimo = producto.getStockMinimo();
        BigDecimal tope = resolverTope(empresa);
        BigDecimal cap = cantidadParaProveedor.min(tope).max(new BigDecimal("0.0001"));
        return new MailPedidoSugerido(
                "[Inventario] Pedido sugerido: " + producto.getCodigo() + " — " + empresa.getNombre(),
                cuerpoComun(empresa, inv, producto, cantidad, stockMinimo, tope, cap),
                cap);
    }

    private static String cuerpoComun(
            Empresa empresa,
            Inventario inv,
            Producto producto,
            BigDecimal cantidad,
            BigDecimal stockMinimo,
            BigDecimal tope,
            BigDecimal cantidadPedidoEnCorreo) {
        return """
                Estimado proveedor,

                El inventario del cliente ha alcanzado el stock mínimo configurado.

                Empresa: %s
                Producto: %s (%s)
                Bodega: %s
                Existencia actual: %s %s
                Stock mínimo configurado: %s %s
                Cantidad sugerida para el pedido (máx. según política del cliente: %s %s): %s %s

                Por favor confirme disponibilidad y plazo de entrega.

                —
                Mensaje generado automáticamente por Inventario Pro.
                """
                .formatted(
                        empresa.getNombre(),
                        producto.getNombre(),
                        producto.getCodigo(),
                        inv.getBodega().getNombre(),
                        cantidad.stripTrailingZeros().toPlainString(),
                        producto.getUnidadMedida(),
                        stockMinimo.stripTrailingZeros().toPlainString(),
                        producto.getUnidadMedida(),
                        tope.stripTrailingZeros().toPlainString(),
                        producto.getUnidadMedida(),
                        cantidadPedidoEnCorreo.stripTrailingZeros().toPlainString(),
                        producto.getUnidadMedida());
    }

    private static BigDecimal resolverTope(Empresa empresa) {
        return empresa.getPedidoProveedorCantidadMaxima() != null
                        && empresa.getPedidoProveedorCantidadMaxima().compareTo(BigDecimal.ZERO) > 0
                ? empresa.getPedidoProveedorCantidadMaxima()
                : DEFAULT_SIN_TOPE;
    }

    private static BigDecimal calcularSugerida(BigDecimal cantidad, BigDecimal stockMinimo, BigDecimal tope) {
        BigDecimal objetivo = stockMinimo.multiply(BigDecimal.valueOf(2));
        BigDecimal sugerida = objetivo.subtract(cantidad).setScale(4, RoundingMode.HALF_UP);
        if (sugerida.compareTo(BigDecimal.ZERO) <= 0) {
            sugerida = stockMinimo.subtract(cantidad).max(BigDecimal.ONE);
        }
        return sugerida.min(tope).max(BigDecimal.ONE);
    }
}

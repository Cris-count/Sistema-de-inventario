package com.inventario.service.inventory;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.InventarioId;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.domain.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;

/**
 * Si el stock en una bodega queda en o bajo el mínimo del producto, envía un correo al proveedor
 * (preferido del producto o último de una entrada) con cantidad sugerida acotada por ajustes de empresa.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockProveedorAlertProcessor {

    private static final BigDecimal DEFAULT_SIN_TOPE = new BigDecimal("999999");

    private final InventarioRepository inventarioRepository;
    private final ProveedorRepository proveedorRepository;
    private final MovimientoRepository movimientoRepository;
    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${app.inventory.stock-alerts.send-email:false}")
    private boolean sendEmail;

    @Value("${app.inventory.stock-alerts.cooldown-hours:24}")
    private int cooldownHours;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Transactional
    public void procesar(long empresaId, long productoId, long bodegaId) {
        Inventario inv = inventarioRepository.findById(new InventarioId(productoId, bodegaId)).orElse(null);
        if (inv == null) {
            return;
        }
        Producto producto = inv.getProducto();
        if (!producto.getEmpresa().getId().equals(empresaId) || !producto.getActivo()) {
            return;
        }
        Empresa empresa = producto.getEmpresa();
        BigDecimal cantidad = inv.getCantidad();
        BigDecimal stockMinimo = producto.getStockMinimo();

        if (cantidad.compareTo(stockMinimo) > 0) {
            if (inv.getUltimaAlertaProveedorAt() != null) {
                inv.setUltimaAlertaProveedorAt(null);
                inventarioRepository.save(inv);
            }
            return;
        }

        if (!empresa.isAlertasPedidoProveedorActivas()) {
            return;
        }
        if (stockMinimo.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        Instant ultima = inv.getUltimaAlertaProveedorAt();
        if (ultima != null && Duration.between(ultima, Instant.now()).toHours() < cooldownHours) {
            return;
        }

        Proveedor proveedor = resolverProveedor(empresaId, producto);
        if (proveedor == null || !StringUtils.hasText(proveedor.getEmail())) {
            log.debug("Sin proveedor con email para producto {} en empresa {}", productoId, empresaId);
            return;
        }

        BigDecimal tope = empresa.getPedidoProveedorCantidadMaxima() != null
                && empresa.getPedidoProveedorCantidadMaxima().compareTo(BigDecimal.ZERO) > 0
                ? empresa.getPedidoProveedorCantidadMaxima()
                : DEFAULT_SIN_TOPE;

        BigDecimal objetivo = stockMinimo.multiply(BigDecimal.valueOf(2));
        BigDecimal sugerida = objetivo.subtract(cantidad).setScale(4, RoundingMode.HALF_UP);
        if (sugerida.compareTo(BigDecimal.ZERO) <= 0) {
            sugerida = stockMinimo.subtract(cantidad).max(BigDecimal.ONE);
        }
        sugerida = sugerida.min(tope).max(BigDecimal.ONE);

        String asunto = "[Inventario] Pedido sugerido: " + producto.getCodigo() + " — " + empresa.getNombre();
        String cuerpo = """
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
                        sugerida.stripTrailingZeros().toPlainString(),
                        producto.getUnidadMedida());

        String cc = StringUtils.hasText(empresa.getEmailNotificacionesInventario())
                ? empresa.getEmailNotificacionesInventario().trim()
                : (StringUtils.hasText(empresa.getEmailContacto()) ? empresa.getEmailContacto().trim() : null);

        boolean enviado = false;
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sendEmail && sender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                if (StringUtils.hasText(mailFrom)) {
                    msg.setFrom(mailFrom);
                }
                msg.setTo(proveedor.getEmail().trim());
                if (StringUtils.hasText(cc)) {
                    msg.setCc(cc);
                }
                msg.setSubject(asunto);
                msg.setText(cuerpo);
                sender.send(msg);
                enviado = true;
            } catch (Exception ex) {
                log.warn("No se pudo enviar correo de alerta de stock a {}: {}", proveedor.getEmail(), ex.getMessage());
            }
        } else {
            log.info(
                    "Alerta stock (dry-run / mail deshabilitado): proveedor={} producto={} bodega={} sugerida={}",
                    proveedor.getEmail(),
                    producto.getCodigo(),
                    inv.getBodega().getCodigo(),
                    sugerida);
            enviado = true;
        }

        if (enviado) {
            inv.setUltimaAlertaProveedorAt(Instant.now());
            inventarioRepository.save(inv);
        }
    }

    private Proveedor resolverProveedor(long empresaId, Producto producto) {
        if (producto.getProveedorPreferido() != null) {
            return proveedorRepository
                    .findByIdAndEmpresaId(producto.getProveedorPreferido().getId(), empresaId)
                    .filter(Proveedor::getActivo)
                    .orElse(null);
        }
        return movimientoRepository
                .findLatestProveedorIdEntradaProducto(empresaId, producto.getId())
                .flatMap(pid -> proveedorRepository.findByIdAndEmpresaId(pid, empresaId))
                .filter(Proveedor::getActivo)
                .orElse(null);
    }
}

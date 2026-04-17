package com.inventario.service.inventory;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.InventarioId;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.repository.ProveedorRepository;
import com.inventario.web.dto.SimularCorreoStockDtos.SimularCorreoStockResponse;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Si el stock en una bodega queda en o bajo el mínimo del producto, envía un correo al proveedor vinculado a ese
 * producto: primero el proveedor preferido en el producto; si no hay, el de la última entrada de compra de ese producto.
 * El e-mail sale del maestro de proveedores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StockProveedorAlertProcessor {

    private static final BigDecimal DEFAULT_SIN_TOPE = new BigDecimal("999999");

    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
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

        Proveedor proveedor = resolverProveedor(empresaId, productoId);
        if (proveedor == null || !StringUtils.hasText(proveedor.getEmail())) {
            log.info(
                    "Alerta stock omitida: sin proveedor con e-mail para producto {} empresa {} (preferido en BD o última entrada).",
                    productoId,
                    empresaId);
            return;
        }

        MailPedidoSugerido mail = construirMailPedidoSugerido(inv);
        String asunto = mail.asunto();
        String cuerpo = mail.cuerpo();
        BigDecimal sugerida = mail.cantidadSugerida();

        String cc = StringUtils.hasText(empresa.getEmailNotificacionesInventario())
                ? empresa.getEmailNotificacionesInventario().trim()
                : (StringUtils.hasText(empresa.getEmailContacto()) ? empresa.getEmailContacto().trim() : null);

        boolean enviado = false;
        JavaMailSender sender = mailSender.getIfAvailable();
        boolean smtpConfigurado = sender != null && StringUtils.hasText(mailFrom);
        if (sendEmail && smtpConfigurado) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(mailFrom.trim());
                msg.setTo(proveedor.getEmail().trim());
                if (StringUtils.hasText(cc)) {
                    msg.setCc(cc);
                }
                msg.setSubject(asunto);
                msg.setText(cuerpo);
                sender.send(msg);
                enviado = true;
                log.info(
                        "Alerta stock enviada por SMTP a {} (producto {} bodega {}).",
                        proveedor.getEmail(),
                        producto.getCodigo(),
                        inv.getBodega().getCodigo());
            } catch (Exception ex) {
                log.warn("No se pudo enviar correo de alerta de stock a {}: {}", proveedor.getEmail(), ex.getMessage());
            }
        } else {
            if (!sendEmail) {
                log.info(
                        "Alerta stock sin envío SMTP (app.inventory.stock-alerts.send-email=false). Destinatario sería {} producto={} bodega={} sugerida={}",
                        proveedor.getEmail(),
                        producto.getCodigo(),
                        inv.getBodega().getCodigo(),
                        sugerida);
            } else if (sender == null) {
                log.info(
                        "Alerta stock sin envío: no hay SMTP (defina spring.mail.host, spring.mail.username, spring.mail.password). "
                                + "Destinatario sería {} producto={} bodega={}",
                        proveedor.getEmail(),
                        producto.getCodigo(),
                        inv.getBodega().getCodigo());
            } else {
                log.info(
                        "Alerta stock sin envío: falta remitente (spring.mail.username). Destinatario sería {} producto={}",
                        proveedor.getEmail(),
                        producto.getCodigo());
            }
            enviado = true;
        }

        if (enviado) {
            inv.setUltimaAlertaProveedorAt(Instant.now());
            inventarioRepository.save(inv);
        }
    }

    /**
     * Envía (o registra en log) el mismo correo de pedido sugerido por bajo stock al correo del proveedor
     * resuelto para el producto (preferido o último en entrada), igual que {@link #procesar}.
     */
    @Transactional(readOnly = true)
    public SimularCorreoStockResponse simularCorreo(long empresaId, Long productoId, Long bodegaId) {
        if ((productoId == null) != (bodegaId == null)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Indique producto y bodega, o deje ambos vacíos para usar la primera alerta activa.");
        }

        Inventario inv = resolverInventarioSimulacion(empresaId, productoId, bodegaId);
        validarLineaBajoMinimoParaSimulacion(inv);

        Producto producto = inv.getProducto();
        Proveedor proveedor = resolverProveedor(empresaId, producto.getId());
        if (proveedor == null || !StringUtils.hasText(proveedor.getEmail())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "No hay proveedor con correo vinculado a este producto. "
                            + "En Productos asigne «Proveedor preferido» (debe tener e-mail en Proveedores), "
                            + "o registre una entrada de compra con proveedor y correo.");
        }
        String destinatario = proveedor.getEmail().trim();

        MailPedidoSugerido mail = construirMailPedidoSugerido(inv);
        String asunto = "[SIMULACIÓN] " + mail.asunto();
        String cuerpo =
                mail.cuerpo()
                        + """

                        ---
                        Nota: mensaje de prueba desde el panel; el envío automático por stock mínimo usa el mismo destinatario.""";

        JavaMailSender sender = mailSender.getIfAvailable();
        boolean smtpOk = sender != null && StringUtils.hasText(mailFrom);
        if (smtpOk) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(mailFrom.trim());
                msg.setTo(destinatario);
                msg.setSubject(asunto);
                msg.setText(cuerpo);
                sender.send(msg);
                return new SimularCorreoStockResponse(
                        "enviado_smtp",
                        "Correo de simulación enviado al proveedor "
                                + proveedor.getRazonSocial()
                                + " ("
                                + destinatario
                                + "). Revise la bandeja o spam.");
            } catch (Exception ex) {
                log.warn("Simulación correo stock: fallo SMTP hacia {}: {}", destinatario, ex.getMessage());
            }
        }

        log.info(
                """
                ========== SIMULACIÓN correo stock bajo (sin SMTP o envío fallido) ==========
                Para: {} ({})
                Asunto: {}
                {}
                ==========================================================""",
                proveedor.getRazonSocial(),
                destinatario,
                asunto,
                cuerpo);
        String ayudaSmtp =
                sender == null
                        ? "Configure variables de entorno o application.yml: spring.mail.host, spring.mail.port (587), "
                                + "spring.mail.username, spring.mail.password; reinicie el API. Sin spring.mail.host no se crea el cliente SMTP."
                        : "Defina spring.mail.username (cuenta/remitente autorizado en su SMTP).";
        return new SimularCorreoStockResponse(
                "solo_log",
                "No se envió por SMTP. "
                        + ayudaSmtp
                        + " El mensaje completo está en el log del servidor (INFO). Destinatario previsto: "
                        + proveedor.getRazonSocial()
                        + " ("
                        + destinatario
                        + ").");
    }

    private Inventario resolverInventarioSimulacion(long empresaId, Long productoId, Long bodegaId) {
        if (productoId != null && bodegaId != null) {
            Inventario inv = inventarioRepository
                    .findById(new InventarioId(productoId, bodegaId))
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Línea de inventario no encontrada."));
            if (!inv.getProducto().getEmpresa().getId().equals(empresaId)) {
                throw new BusinessException(HttpStatus.FORBIDDEN, "La línea no pertenece a su empresa.");
            }
            return inv;
        }
        List<Inventario> list = inventarioRepository.findBajoMinimoPorEmpresa(empresaId, null);
        if (list.isEmpty()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "No hay productos bajo stock mínimo; ajuste existencias o el mínimo para probar.");
        }
        return list.get(0);
    }

    private static void validarLineaBajoMinimoParaSimulacion(Inventario inv) {
        Producto p = inv.getProducto();
        BigDecimal cant = inv.getCantidad();
        BigDecimal min = p.getStockMinimo();
        if (min.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El producto debe tener stock mínimo mayor que cero.");
        }
        if (cant.compareTo(min) > 0) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "La línea seleccionada no está bajo el mínimo; use «Ver alertas mínimo» y reintente.");
        }
    }

    private MailPedidoSugerido construirMailPedidoSugerido(Inventario inv) {
        Producto producto = inv.getProducto();
        Empresa empresa = producto.getEmpresa();
        BigDecimal cantidad = inv.getCantidad();
        BigDecimal stockMinimo = producto.getStockMinimo();
        BigDecimal tope = resolverTope(empresa);
        BigDecimal sugerida = calcularSugerida(cantidad, stockMinimo, tope);

        String asunto = "[Inventario] Pedido sugerido: " + producto.getCodigo() + " — " + empresa.getNombre();
        String cuerpo =
                """
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
        return new MailPedidoSugerido(asunto, cuerpo, sugerida);
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

    /**
     * Proveedor asociado al producto: primero {@code proveedor_preferido_id} leído en SQL (fiable tras {@code @Async});
     * si no hay, el de la última ENTRADA de ese producto. El e-mail viene del registro en {@code proveedor}.
     */
    private Proveedor resolverProveedor(long empresaId, long productoId) {
        Long preferidoId = productoRepository.findProveedorPreferidoIdByIdAndEmpresa(productoId, empresaId);
        if (preferidoId != null) {
            return proveedorRepository
                    .findByIdAndEmpresaId(preferidoId, empresaId)
                    .filter(Proveedor::getActivo)
                    .orElse(null);
        }
        return movimientoRepository
                .findLatestProveedorIdEntradaProducto(empresaId, productoId)
                .flatMap(pid -> proveedorRepository.findByIdAndEmpresaId(pid, empresaId))
                .filter(Proveedor::getActivo)
                .orElse(null);
    }
}

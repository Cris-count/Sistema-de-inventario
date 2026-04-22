package com.inventario.service.inventory;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.PedidoProveedorMensajeDtos.*;
import com.inventario.web.dto.SimularCorreoStockDtos.SimularCorreoStockResponse;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Bandeja de solicitudes de pedido al proveedor: el correo SMTP solo se envía tras aprobación del administrador.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PedidoProveedorMensajeService {

    private static final BigDecimal DEFAULT_SIN_TOPE = new BigDecimal("999999");

    private final PedidoProveedorMensajeRepository mensajeRepository;
    private final InventarioRepository inventarioRepository;
    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final ProveedorSugeridoResolver proveedorSugeridoResolver;
    private final UsuarioRepository usuarioRepository;
    private final PedidoProveedorMailComposer mailComposer;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final PlanEntitlementService planEntitlementService;
    private final CurrentUserService currentUserService;

    @Value("${app.inventory.stock-alerts.send-email:true}")
    private boolean sendEmail;

    @Value("${app.inventory.stock-alerts.cooldown-hours:24}")
    private int cooldownHours;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Transactional
    public void registrarAlertaAutomatica(long empresaId, long productoId, long bodegaId) {
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId).orElse(null);
        if (producto == null || !producto.getActivo()) {
            return;
        }
        Inventario inv = inventarioRepository.findById(new InventarioId(productoId, bodegaId)).orElse(null);
        if (inv == null) {
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

        if (mensajeRepository.existsByEmpresa_IdAndProducto_IdAndBodega_IdAndEstado(
                empresaId, productoId, bodegaId, PedidoProveedorMensajeEstado.PENDIENTE)) {
            return;
        }

        Proveedor proveedor = resolverProveedor(empresaId, productoId);
        if (proveedor == null || !StringUtils.hasText(proveedor.getEmail())) {
            log.info(
                    "Alerta stock: sin proveedor con e-mail para producto {} empresa {}.",
                    productoId,
                    empresaId);
            return;
        }

        MailPedidoSugerido mail = mailComposer.buildSugerido(inv, producto);
        guardarMensajePendiente(
                empresa,
                inv,
                producto,
                proveedor,
                PedidoProveedorMensajeOrigen.ALERTA_AUTOMATICA,
                mail.cantidadSugerida(),
                cantidad,
                stockMinimo,
                producto.getUnidadMedida());

        inv.setUltimaAlertaProveedorAt(Instant.now());
        inventarioRepository.save(inv);
    }

    @Transactional
    public SimularCorreoStockResponse simularSolicitud(long empresaId, Long productoId, Long bodegaId) {
        if ((productoId == null) != (bodegaId == null)) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Indique producto y bodega, o deje ambos vacíos para usar la primera alerta activa.");
        }

        Inventario inv = resolverInventarioSimulacion(empresaId, productoId, bodegaId);
        Producto producto = productoRepository
                .findByIdAndEmpresaId(inv.getProducto().getId(), empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
        validarLineaBajoMinimo(inv.getCantidad(), producto);

        if (mensajeRepository.existsByEmpresa_IdAndProducto_IdAndBodega_IdAndEstado(
                empresaId, producto.getId(), inv.getBodega().getId(), PedidoProveedorMensajeEstado.PENDIENTE)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Ya existe una solicitud pendiente para esta línea de inventario. "
                            + "Revise «Mensajes pedido» (solo administradores) y apruebe o rechace antes de crear otra.");
        }

        Proveedor proveedor = resolverProveedor(empresaId, producto.getId());
        if (proveedor == null || !StringUtils.hasText(proveedor.getEmail())) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "No hay proveedor con correo vinculado a este producto. "
                            + "En Productos asigne «Proveedor preferido» (debe tener e-mail en Proveedores), "
                            + "o registre una entrada de compra con proveedor y correo.");
        }

        MailPedidoSugerido mail = mailComposer.buildSugerido(inv, producto);
        Empresa empresa = producto.getEmpresa();
        guardarMensajePendiente(
                empresa,
                inv,
                producto,
                proveedor,
                PedidoProveedorMensajeOrigen.SIMULACION_INVENTARIO,
                mail.cantidadSugerida(),
                inv.getCantidad(),
                producto.getStockMinimo(),
                producto.getUnidadMedida());

        return new SimularCorreoStockResponse(
                "pendiente_admin",
                "Solicitud registrada. Un administrador debe revisarla en «Mensajes pedido»; "
                        + "solo tras aprobar se enviará el correo al proveedor "
                        + proveedor.getRazonSocial()
                        + " ("
                        + proveedor.getEmail().trim()
                        + ").");
    }

    @Transactional(readOnly = true)
    public Page<PedidoProveedorMensajeResponse> listar(
            long empresaId, PedidoProveedorMensajeEstado estado, Pageable pageable) {
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Page<PedidoProveedorMensaje> page =
                estado == null
                        ? mensajeRepository.findByEmpresa_IdOrderByCreadoEnDesc(empresaId, pageable)
                        : mensajeRepository.findByEmpresa_IdAndEstadoOrderByCreadoEnDesc(
                                empresaId, estado, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public PedidoProveedorMensajeResponse obtener(long id, long empresaId) {
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        PedidoProveedorMensaje m = mensajeRepository
                .findByIdAndEmpresa_Id(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Mensaje no encontrado."));
        return toResponse(m);
    }

    @Transactional
    public ResolverPedidoProveedorResponse aprobar(long id, AprobarPedidoProveedorRequest req) {
        long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Usuario usuario = currentUserService.requireUsuario();
        long usuarioId = usuario.getId();

        PedidoProveedorMensaje m = mensajeRepository
                .findByIdAndEmpresa_Id(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Mensaje no encontrado."));
        if (m.getEstado() != PedidoProveedorMensajeEstado.PENDIENTE) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Esta solicitud ya fue resuelta.");
        }

        Producto producto = productoRepository
                .findByIdAndEmpresaId(m.getProducto().getId(), empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado."));
        Inventario inv = inventarioRepository
                .findById(new InventarioId(m.getProducto().getId(), m.getBodega().getId()))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Línea de inventario no encontrada."));
        Proveedor proveedor = proveedorRepository
                .findByIdAndEmpresaId(m.getProveedor().getId(), empresaId)
                .filter(Proveedor::getActivo)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Proveedor no disponible."));
        if (!StringUtils.hasText(proveedor.getEmail())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El proveedor no tiene correo configurado.");
        }

        Empresa empresa = producto.getEmpresa();
        BigDecimal cantidad = capCantidadPedido(req.cantidadParaProveedor(), empresa);
        m.setCantidadParaProveedor(cantidad);
        m.setNotasAdmin(StringUtils.hasText(req.notasAdmin()) ? req.notasAdmin().trim() : null);

        MailPedidoSugerido mail = mailComposer.buildConCantidadAdministrador(inv, producto, cantidad);
        String cc = StringUtils.hasText(empresa.getEmailNotificacionesInventario())
                ? empresa.getEmailNotificacionesInventario().trim()
                : (StringUtils.hasText(empresa.getEmailContacto()) ? empresa.getEmailContacto().trim() : null);

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
                msg.setSubject(mail.asunto());
                msg.setText(mail.cuerpo());
                sender.send(msg);
                log.info(
                        "Pedido a proveedor enviado por SMTP a {} (producto {} bodega {}).",
                        proveedor.getEmail(),
                        producto.getCodigo(),
                        inv.getBodega().getCodigo());
            } catch (Exception ex) {
                throw new BusinessException(
                        HttpStatus.BAD_GATEWAY,
                        "No se pudo enviar el correo al proveedor: " + ex.getMessage());
            }
        } else {
            log.info(
                    "Aprobación sin SMTP (send-email={} o mail no configurado). Correo no enviado. Destinatario: {} producto={}",
                    sendEmail,
                    proveedor.getEmail(),
                    producto.getCodigo());
        }

        m.setEstado(PedidoProveedorMensajeEstado.APROBADO);
        m.setResueltoEn(Instant.now());
        m.setResueltoPor(usuarioRepository.getReferenceById(usuarioId));
        mensajeRepository.save(m);

        inv.setUltimaAlertaProveedorAt(Instant.now());
        inventarioRepository.save(inv);

        boolean envioReal = sendEmail && smtpConfigurado;
        return new ResolverPedidoProveedorResponse(
                envioReal ? "enviado_smtp" : "aprobado_sin_smtp",
                envioReal
                        ? "Correo enviado al proveedor " + proveedor.getRazonSocial() + "."
                        : "Solicitud aprobada. No hay envío SMTP configurado; el proveedor no recibió correo.");
    }

    @Transactional
    public ResolverPedidoProveedorResponse rechazar(long id, RechazarPedidoProveedorRequest req) {
        long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Usuario usuario = currentUserService.requireUsuario();

        PedidoProveedorMensaje m = mensajeRepository
                .findByIdAndEmpresa_Id(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Mensaje no encontrado."));
        if (m.getEstado() != PedidoProveedorMensajeEstado.PENDIENTE) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Esta solicitud ya fue resuelta.");
        }

        m.setEstado(PedidoProveedorMensajeEstado.RECHAZADO);
        m.setResueltoEn(Instant.now());
        m.setResueltoPor(usuarioRepository.getReferenceById(usuario.getId()));
        m.setNotasAdmin(StringUtils.hasText(req.notasAdmin()) ? req.notasAdmin().trim() : null);
        mensajeRepository.save(m);

        inventarioRepository
                .findById(new InventarioId(m.getProducto().getId(), m.getBodega().getId()))
                .ifPresent(inv -> {
                    inv.setUltimaAlertaProveedorAt(Instant.now());
                    inventarioRepository.save(inv);
                });

        return new ResolverPedidoProveedorResponse(
                "rechazado", "Solicitud rechazada. No se envió correo al proveedor.");
    }

    private void guardarMensajePendiente(
            Empresa empresa,
            Inventario inv,
            Producto producto,
            Proveedor proveedor,
            PedidoProveedorMensajeOrigen origen,
            BigDecimal cantidadSugerida,
            BigDecimal existencia,
            BigDecimal stockMinimo,
            String unidadMedida) {
        PedidoProveedorMensaje m = PedidoProveedorMensaje.builder()
                .empresa(empresa)
                .producto(producto)
                .bodega(inv.getBodega())
                .proveedor(proveedor)
                .origen(origen)
                .estado(PedidoProveedorMensajeEstado.PENDIENTE)
                .cantidadSugerida(cantidadSugerida)
                .cantidadParaProveedor(cantidadSugerida)
                .existenciaSnapshot(existencia)
                .stockMinimoSnapshot(stockMinimo)
                .unidadMedida(unidadMedida)
                .creadoEn(Instant.now())
                .build();
        mensajeRepository.save(m);
    }

    private PedidoProveedorMensajeResponse toResponse(PedidoProveedorMensaje m) {
        Usuario r = m.getResueltoPor();
        String rNombre = null;
        if (r != null) {
            rNombre = r.getNombre();
            if (StringUtils.hasText(r.getApellido())) {
                rNombre = rNombre + " " + r.getApellido();
            }
        }
        return new PedidoProveedorMensajeResponse(
                m.getId(),
                m.getOrigen(),
                m.getEstado(),
                m.getProducto().getId(),
                m.getProducto().getCodigo(),
                m.getProducto().getNombre(),
                m.getBodega().getId(),
                m.getBodega().getNombre(),
                m.getProveedor().getId(),
                m.getProveedor().getRazonSocial(),
                m.getProveedor().getEmail(),
                m.getCantidadSugerida(),
                m.getCantidadParaProveedor(),
                m.getExistenciaSnapshot(),
                m.getStockMinimoSnapshot(),
                m.getUnidadMedida(),
                m.getCreadoEn(),
                m.getResueltoEn(),
                r != null ? r.getId() : null,
                rNombre,
                m.getNotasAdmin());
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

    private static void validarLineaBajoMinimo(BigDecimal cantidad, Producto producto) {
        BigDecimal min = producto.getStockMinimo();
        if (min.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El producto debe tener stock mínimo mayor que cero.");
        }
        if (cantidad.compareTo(min) > 0) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "La línea seleccionada no está bajo el mínimo; use «Ver alertas mínimo» y reintente.");
        }
    }

    private Proveedor resolverProveedor(long empresaId, long productoId) {
        return proveedorSugeridoResolver
                .resolverConFuente(empresaId, productoId)
                .map(ProveedorSugeridoResolver.Sugerencia::proveedor)
                .orElse(null);
    }

    private static BigDecimal capCantidadPedido(BigDecimal solicitada, Empresa empresa) {
        BigDecimal tope =
                empresa.getPedidoProveedorCantidadMaxima() != null
                                && empresa.getPedidoProveedorCantidadMaxima().compareTo(BigDecimal.ZERO) > 0
                        ? empresa.getPedidoProveedorCantidadMaxima()
                        : DEFAULT_SIN_TOPE;
        return solicitada.max(new BigDecimal("0.0001")).min(tope).setScale(4, java.math.RoundingMode.HALF_UP);
    }
}

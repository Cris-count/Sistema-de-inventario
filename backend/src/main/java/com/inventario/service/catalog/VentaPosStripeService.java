package com.inventario.service.catalog;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.VentaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.MovimientoService;
import com.inventario.service.billing.StripeCheckoutService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.VentaDtos.VentaCreateRequest;
import com.inventario.web.dto.VentaDtos.VentaDetailResponse;
import com.inventario.web.dto.VentaDtos.VentaStripePrepararResponse;
import com.inventario.web.dto.VentaDtos.VentaStripeSyncRequest;
import com.inventario.web.error.BusinessException;
import com.stripe.model.checkout.Session;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Ventas POS con cobro Stripe Checkout: la venta queda {@link VentaEstado#PENDIENTE_PAGO} sin movimiento hasta que
 * el webhook (o una sincronización autenticada) confirme el pago contra la API de Stripe.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VentaPosStripeService {

    private static final String COP = "cop";

    private final VentaRepository ventaRepository;
    private final MovimientoService movimientoService;
    private final VentaConsecutivoService ventaConsecutivoService;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;
    private final StripeCheckoutService stripeCheckoutService;
    private final VentaService ventaService;
    private final VentaPreparacionService ventaPreparacionService;

    @Transactional(rollbackFor = Exception.class)
    public VentaStripePrepararResponse prepararCheckoutStripe(VentaCreateRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.MOVIMIENTOS_BASICOS);

        if (!stripeCheckoutService.isEnabled()) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe no está configurado. Define STRIPE_SECRET_KEY en el entorno del servidor.");
        }

        var preparada = ventaPreparacionService.preparar(usuario, empresaId, req, true);
        String codigoPublico = ventaConsecutivoService.siguienteCodigoPublico(empresaId);
        Instant ahora = Instant.now();

        Venta venta = new Venta();
        venta.setEmpresa(usuario.getEmpresa());
        venta.setBodega(preparada.bodega());
        venta.setUsuario(usuario);
        venta.setCliente(preparada.cliente());
        venta.setMovimiento(null);
        venta.setCodigoPublico(codigoPublico);
        venta.setFechaVenta(ahora);
        venta.setTotal(preparada.total());
        venta.setEstado(VentaEstado.PENDIENTE_PAGO);
        venta.setMetodoPago(VentaMetodoPago.STRIPE);
        venta.setPagoEstado(VentaPagoEstado.STRIPE_PENDING);
        venta.setObservacion(preparada.observacion());
        venta.setCreatedAt(ahora);

        ventaPreparacionService.agregarDetalles(venta, preparada);

        Venta guardada = ventaRepository.save(venta);

        StripeCheckoutService.StripeSessionResult stripe =
                stripeCheckoutService.createPosVentaCheckoutSession(
                        guardada.getId(), empresaId, preparada.total(), COP, codigoPublico);
        guardada.setStripeCheckoutSessionId(stripe.sessionId());
        ventaRepository.save(guardada);

        return new VentaStripePrepararResponse(
                guardada.getId(),
                guardada.getCodigoPublico(),
                guardada.getTotal(),
                guardada.getEstado().name(),
                stripe.checkoutUrl(),
                stripe.sessionId());
    }

    @Transactional(rollbackFor = Exception.class)
    public VentaDetailResponse sincronizarPago(Long ventaId, VentaStripeSyncRequest body) {
        Usuario usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);

        Venta v =
                ventaRepository
                        .findByIdAndEmpresa_Id(ventaId, empresaId)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada"));
        assertPuedeVerVenta(usuario, v);

        Session session = stripeCheckoutService.retrieveCheckoutSession(body.sessionId());
        finalizePaidPosVentaFromStripeSession(session, v.getId(), empresaId, false);

        return ventaService.obtener(ventaId);
    }

    @Transactional(rollbackFor = Exception.class)
    public void cancelarVentaPendiente(Long ventaId) {
        Usuario usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.MOVIMIENTOS_BASICOS);

        Venta v = ventaRepository
                .findByIdAndEmpresa_IdForUpdate(ventaId, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada"));
        assertPuedeVerVenta(usuario, v);

        if (v.getEstado() != VentaEstado.PENDIENTE_PAGO) {
            throw new BusinessException(HttpStatus.CONFLICT, "Solo se pueden cancelar ventas pendientes de pago.");
        }
        if (v.getPagoEstado() != VentaPagoEstado.STRIPE_PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "Esta venta no está en espera de pago Stripe.");
        }
        v.setEstado(VentaEstado.CANCELADA_SIN_PAGO);
        v.setPagoEstado(VentaPagoEstado.STRIPE_CANCELLED);
        ventaRepository.save(v);
    }

    /**
     * Llamado desde el webhook Stripe (firma ya validada). Idempotente y con bloqueo pesimista al confirmar.
     */
    @Transactional(rollbackFor = Exception.class)
    public void applyCheckoutSessionCompletedFromWebhook(Session session, String stripeEventId) {
        if (session == null || session.getId() == null) {
            log.warn("POS Stripe webhook: sesión nula");
            return;
        }
        Map<String, String> md = session.getMetadata();
        if (md == null || !StripeCheckoutService.FLOW_POS_VENTA.equals(md.get("flowType"))) {
            log.warn("POS Stripe webhook: flowType inesperado sesión={}", session.getId());
            return;
        }
        String ventaIdRaw = md.get("ventaId");
        String empresaIdRaw = md.get("empresaId");
        if (ventaIdRaw == null || empresaIdRaw == null) {
            log.warn("POS Stripe webhook: metadata incompleta ventaId/empresaId sesión={}", session.getId());
            return;
        }
        final long ventaId;
        final long empresaId;
        try {
            ventaId = Long.parseLong(ventaIdRaw.trim());
            empresaId = Long.parseLong(empresaIdRaw.trim());
        } catch (NumberFormatException e) {
            log.warn("POS Stripe webhook: ids numéricos inválidos sesión={}", session.getId());
            return;
        }

        try {
            finalizePaidPosVentaFromStripeSession(session, ventaId, empresaId, true);
        } catch (BusinessException ex) {
            if (ex.getStatus() == HttpStatus.CONFLICT) {
                log.info("POS Stripe webhook: reintento posible eventId={} — {}", stripeEventId, ex.getMessage());
                throw ex;
            }
            log.info("POS Stripe webhook: eventId={} — {}", stripeEventId, ex.getMessage());
        }
    }

    private void finalizePaidPosVentaFromStripeSession(
            Session session, long ventaId, long empresaId, boolean fromWebhook) {
        String sessionId = session.getId();
        String pay = session.getPaymentStatus();
        String st = session.getStatus();
        if (pay == null || !"paid".equalsIgnoreCase(pay.trim())) {
            if (fromWebhook) {
                log.info("POS Stripe: sesión {} payment_status={} — sin finalizar venta", sessionId, pay);
            }
            throw new BusinessException(HttpStatus.CONFLICT, "El pago en Stripe aún no está confirmado como pagado.");
        }
        if (st == null || !"complete".equalsIgnoreCase(st.trim())) {
            throw new BusinessException(HttpStatus.CONFLICT, "La sesión de Stripe no está completa.");
        }

        Map<String, String> md = session.getMetadata();
        if (md == null
                || !StripeCheckoutService.FLOW_POS_VENTA.equals(md.get("flowType"))
                || !String.valueOf(ventaId).equals(md.get("ventaId"))
                || !String.valueOf(empresaId).equals(md.get("empresaId"))) {
            throw new BusinessException(HttpStatus.CONFLICT, "La sesión de Stripe no corresponde a esta venta.");
        }

        Venta venta =
                ventaRepository
                        .findByIdAndEmpresa_IdForUpdate(ventaId, empresaId)
                        .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada"));

        if (venta.getEstado() == VentaEstado.CONFIRMADA && venta.getPagoEstado() == VentaPagoEstado.STRIPE_SUCCEEDED) {
            log.info("POS Stripe: idempotente ventaId={} session={}", ventaId, sessionId);
            return;
        }

        if (venta.getEstado() != VentaEstado.PENDIENTE_PAGO) {
            throw new BusinessException(
                    HttpStatus.CONFLICT, "La venta no está pendiente de pago; no se aplica el cobro.");
        }
        if (venta.getPagoEstado() != VentaPagoEstado.STRIPE_PENDING) {
            throw new BusinessException(HttpStatus.CONFLICT, "Estado de pago inesperado para finalizar la venta.");
        }
        if (venta.getStripeCheckoutSessionId() == null
                || !venta.getStripeCheckoutSessionId().equals(sessionId)) {
            throw new BusinessException(HttpStatus.CONFLICT, "La sesión de Stripe no coincide con la venta pendiente.");
        }

        long expectedMinor = StripeCheckoutService.toStripeMinorUnits(venta.getTotal());
        Long amountTotal = session.getAmountTotal();
        if (amountTotal == null || amountTotal != expectedMinor) {
            log.warn(
                    "POS Stripe: monto sesión {} ≠ total venta {} (esperado minor {})",
                    amountTotal,
                    venta.getTotal(),
                    expectedMinor);
            throw new BusinessException(HttpStatus.CONFLICT, "El monto cobrado no coincide con el total de la venta.");
        }
        String metaMinor = md.get("amountMinor");
        if (metaMinor != null) {
            try {
                if (Long.parseLong(metaMinor.trim()) != expectedMinor) {
                    throw new BusinessException(HttpStatus.CONFLICT, "Metadata de monto inconsistente.");
                }
            } catch (NumberFormatException e) {
                throw new BusinessException(HttpStatus.CONFLICT, "Metadata de monto inválida.");
            }
        }

        String pi = session.getPaymentIntent();

        String obsVenta = venta.getObservacion() == null ? null : venta.getObservacion().trim();
        String codigoPublico = venta.getCodigoPublico();
        Long bodegaId = venta.getBodega().getId();

        Movimiento movimiento =
                movimientoService.registrarMovimientoSalidaPorVenta(
                        bodegaId,
                        ventaPreparacionService.lineasSalidaDesdeVenta(venta),
                        obsVenta,
                        codigoPublico);

        Instant ahora = Instant.now();
        venta.setMovimiento(movimiento);
        venta.setEstado(VentaEstado.CONFIRMADA);
        venta.setMetodoPago(VentaMetodoPago.STRIPE);
        venta.setPagoEstado(VentaPagoEstado.STRIPE_SUCCEEDED);
        venta.setPaidAt(ahora);
        if (pi != null) {
            venta.setStripePaymentIntentId(pi);
        }
        ventaRepository.save(venta);
        log.info("POS Stripe: venta {} confirmada session={} webhook={}", ventaId, sessionId, fromWebhook);
    }

    private void assertPuedeVerVenta(Usuario usuario, Venta v) {
        String rol = SecurityRoles.canonicalCodigo(usuario.getRol().getCodigo());
        if (SecurityRoles.VENTAS.equals(rol) && !v.getUsuario().getId().equals(usuario.getId())) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada");
        }
    }

}

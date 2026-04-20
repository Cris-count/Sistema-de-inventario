package com.inventario.service.billing;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.SaasCompraRepository;
import com.inventario.service.saas.PlanChangePendingCloseReason;

import java.time.Instant;
import java.util.Objects;

/**
 * Política explícita de negocio para aceptar confirmaciones de pago <strong>tardías</strong> en
 * cambios de plan cerrados por expiración automática (TTL), sin rediseñar el flujo principal.
 * <p>
 * Condiciones de aceptación (todas obligatorias): ver {@link #evaluateLatePaymentAcceptance}.
 */
public final class PlanChangeLatePaymentPolicy {

    private PlanChangeLatePaymentPolicy() {}

    /**
     * Motivo cuando no aplica aceptación tardía (auditoría / logs). {@link #NONE} solo en ruta exitosa.
     */
    public enum DenialReason {
        NONE,
        MANUAL_CANCEL_BY_USER,
        INCOMPLETE_SYSTEM_CLOSE,
        NOT_MARKED_AS_SYSTEM_EXPIRY,
        INCONSISTENT_COMPRA_FOR_SYSTEM_EXPIRY,
        NOT_PLAN_CHANGE_PAYMENT_ORIGIN,
        ANOTHER_PLAN_CHANGE_PENDING,
        OUTSIDE_LATE_CONFIRMATION_WINDOW,
        NO_ELIGIBLE_TIMESTAMP
    }

    /**
     * @param userMessage mensaje seguro para API/cliente si {@code eligible == false}; {@code null} si aplica.
     * @param logDetail     fragmento corto para logs (sin datos sensibles).
     */
    public record Evaluation(boolean eligible, DenialReason denialReason, String userMessage, String logDetail) {

        public static Evaluation accept() {
            return new Evaluation(true, DenialReason.NONE, null, "policy_accepted");
        }

        public static Evaluation deny(DenialReason reason, String userMessage, String logDetail) {
            return new Evaluation(false, reason, userMessage, logDetail);
        }
    }

    /**
     * Evalúa si un pago {@link EstadoPago#RECHAZADO} de un {@link SaasCompraTipo#CAMBIO_PLAN} puede aceptarse
     * fuera de la ventana “pendiente” habitual, porque la pasarela notificó tarde tras expiración por sistema.
     * <p>
     * Debe cumplirse <strong>todo</strong> lo siguiente:
     * <ul>
     *   <li>La compra es {@link SaasCompraTipo#CAMBIO_PLAN}.</li>
     *   <li>El pago fue originado por el flujo de cambio de plan ({@link PlanChangePendingCloseReason#SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN}).</li>
     *   <li>El pago está {@link EstadoPago#RECHAZADO} con {@code confirmationChannel}
     *       {@link PlanChangePendingCloseReason#EXPIRADO_SISTEMA} (no cancelación manual ni cierre incompleto).</li>
     *   <li>La compra está {@link EstadoCompra#CANCELADA} (coherente con cierre por TTL en servicio de suscripción).</li>
     *   <li>No existe otro {@link SaasCompraTipo#CAMBIO_PLAN} en {@link EstadoCompra#PENDIENTE_PAGO} para la empresa.</li>
     *   <li>La marca temporal de referencia (preferente {@code pago.createdAt}) no supera la ventana configurada.</li>
     * </ul>
     */
    public static Evaluation evaluateLatePaymentAcceptance(
            SaasPago pago,
            SaasCompra compra,
            Empresa empresa,
            Instant now,
            SaasCompraRepository saasCompraRepository,
            long configuredMaxHours) {
        Objects.requireNonNull(pago, "pago");
        Objects.requireNonNull(compra, "compra");
        Objects.requireNonNull(empresa, "empresa");
        Objects.requireNonNull(now, "now");
        Objects.requireNonNull(saasCompraRepository, "saasCompraRepository");

        if (compra.getTipo() != SaasCompraTipo.CAMBIO_PLAN) {
            return Evaluation.deny(
                    DenialReason.NOT_PLAN_CHANGE_PAYMENT_ORIGIN,
                    "Este pago no corresponde a un cambio de plan que podamos completar automáticamente. "
                            + "Contacta a soporte con la referencia del pago.",
                    "compra_tipo=" + compra.getTipo());
        }

        if (pago.getEstado() != EstadoPago.RECHAZADO) {
            return Evaluation.deny(
                    DenialReason.NOT_MARKED_AS_SYSTEM_EXPIRY,
                    "Este pago no está en el estado requerido para una confirmación tardía. "
                            + "Si el cobro ya se realizó, contacta a soporte con la referencia del pago.",
                    "pago_estado=" + pago.getEstado());
        }

        String proveedor = pago.getProveedor();
        if (proveedor == null
                || !PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN.equals(proveedor)) {
            return Evaluation.deny(
                    DenialReason.NOT_PLAN_CHANGE_PAYMENT_ORIGIN,
                    "Este pago no coincide con el origen esperado del cambio de plan; no podemos aplicarlo de forma automática. "
                            + "Contacta a soporte con la referencia del pago.",
                    "proveedor=" + proveedor);
        }

        String channel = pago.getConfirmationChannel();
        if (PlanChangePendingCloseReason.CANCELADO_USUARIO.equals(channel)) {
            return Evaluation.deny(
                    DenialReason.MANUAL_CANCEL_BY_USER,
                    "Este cambio de plan fue cancelado desde la cuenta. Si el cobro ya se realizó, contacta a soporte con la referencia del pago.",
                    "channel=CANCELADO_USUARIO");
        }
        if (PlanChangePendingCloseReason.PENDIENTE_SIN_PAGO.equals(channel)) {
            return Evaluation.deny(
                    DenialReason.INCOMPLETE_SYSTEM_CLOSE,
                    "Esta solicitud de cambio de plan quedó incompleta en el sistema y no admite confirmación de pago. "
                            + "Contacta a soporte con la referencia del pago.",
                    "channel=PENDIENTE_SIN_PAGO");
        }

        if (!PlanChangePendingCloseReason.EXPIRADO_SISTEMA.equals(channel)) {
            return Evaluation.deny(
                    DenialReason.NOT_MARKED_AS_SYSTEM_EXPIRY,
                    "Este pago no puede confirmarse de forma automática porque no consta como vencido por el sistema. "
                            + "Contacta a soporte con la referencia del pago.",
                    "channel=" + channel);
        }

        if (compra.getEstado() != EstadoCompra.CANCELADA) {
            return Evaluation.deny(
                    DenialReason.INCONSISTENT_COMPRA_FOR_SYSTEM_EXPIRY,
                    "Los datos de esta solicitud no coinciden; no podemos confirmar el pago automáticamente. "
                            + "Contacta a soporte con la referencia del pago.",
                    "compra_estado=" + compra.getEstado() + " expected=CANCELADA for EXPIRADO_SISTEMA");
        }

        if (saasCompraRepository.existsByEmpresa_IdAndTipoAndEstado(
                empresa.getId(), SaasCompraTipo.CAMBIO_PLAN, EstadoCompra.PENDIENTE_PAGO)) {
            return Evaluation.deny(
                    DenialReason.ANOTHER_PLAN_CHANGE_PENDING,
                    "Hay otro cambio de plan pendiente de pago. Este cobro corresponde a una solicitud anterior que venció. "
                            + "Contacta a soporte con la referencia del pago para conciliar.",
                    "empresa_id=" + empresa.getId() + " other_pending=true");
        }

        Instant anchor = pago.getCreatedAt() != null ? pago.getCreatedAt() : compra.getCreatedAt();
        if (anchor == null) {
            return Evaluation.deny(
                    DenialReason.NO_ELIGIBLE_TIMESTAMP,
                    "No hay una fecha de referencia válida para aplicar la política de confirmación tardía. "
                            + "Contacta a soporte con la referencia del pago.",
                    "anchor=null");
        }

        long maxHours = configuredMaxHours > 0 ? configuredMaxHours : 72;
        if (now.isAfter(anchor.plusSeconds(maxHours * 3600L))) {
            return Evaluation.deny(
                    DenialReason.OUTSIDE_LATE_CONFIRMATION_WINDOW,
                    "El plazo permitido para confirmar este pago tras el vencimiento de la solicitud ya expiró. "
                            + "Si el cobro es válido, contacta a soporte con la referencia del pago.",
                    "anchor=" + anchor + " maxHours=" + maxHours);
        }

        return Evaluation.accept();
    }
}

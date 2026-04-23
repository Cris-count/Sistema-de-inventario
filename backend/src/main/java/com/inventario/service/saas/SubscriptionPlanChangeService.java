package com.inventario.service.saas;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.SaasCompraRepository;
import com.inventario.domain.repository.SaasPagoRepository;
import com.inventario.domain.repository.SaasPlanRepository;
import com.inventario.domain.repository.SuscripcionRepository;
import com.inventario.web.dto.empresa.CambioPlanDtos;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SubscriptionPlanChangeService {

    private final SuscripcionRepository suscripcionRepository;
    private final SaasPlanRepository saasPlanRepository;
    private final SaasCompraRepository saasCompraRepository;
    private final SaasPagoRepository saasPagoRepository;
    private final PlanEntitlementService planEntitlementService;
    @Value("${app.billing.plan-change-pending-ttl-hours:72}")
    private long planChangePendingTtlHours;

    public record PendingPlanChange(
            Long compraId,
            Long pagoId,
            String planCodigoDestino,
            String planNombreDestino,
            Instant createdAt,
            Instant expiresAt
    ) {}

    public record PendingPlanStatus(PendingPlanChange pending, String notice) {}

    @Transactional(readOnly = true)
    public PendingPlanStatus pendingPlanStatusForEmpresa(Long empresaId) {
        return normalizePendingPlanChange(empresaId, Instant.now());
    }

    @Transactional(rollbackFor = Exception.class)
    public CambioPlanDtos.CambioPlanSolicitudResponse solicitarCambio(Long empresaId, String nuevoPlanCodigoRaw) {
        if (nuevoPlanCodigoRaw == null || nuevoPlanCodigoRaw.isBlank()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Indica un plan válido.");
        }
        String nuevo = nuevoPlanCodigoRaw.trim().toUpperCase(Locale.ROOT);
        if (PlanTierOrder.tier(nuevo) == 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Plan no reconocido.");
        }

        Suscripcion sub = suscripcionRepository
                .findByEmpresaId(empresaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.CONFLICT,
                        "No encontramos una suscripción activa para tu empresa. Contacta a soporte para revisar tu cuenta.",
                        SubscriptionStateBlockCodes.SUSCRIPCION_NO_ENCONTRADA));
        SaasPlan actualPlan = sub.getPlan();
        if (actualPlan == null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Tu suscripción no tiene un plan asignado en este momento. Contacta a soporte para corregirlo.",
                    SubscriptionStateBlockCodes.PLAN_NO_ASIGNADO_EN_SUSCRIPCION);
        }
        String actualCodigo = actualPlan.getCodigo().trim().toUpperCase(Locale.ROOT);
        if (actualCodigo.equals(nuevo)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Ya estás en este plan.");
        }

        EstadoSuscripcion est = sub.getEstado();
        if (est != EstadoSuscripcion.ACTIVA && est != EstadoSuscripcion.TRIAL) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "En este momento no puedes cambiar de plan con el estado actual de tu suscripción. "
                            + "Revisa los detalles en Mi empresa o contacta a soporte si necesitas ayuda.",
                    PlanBlockCodes.CAMBIO_SUSCRIPCION_NO_PERMITIDA);
        }

        PendingPlanStatus pendingStatus = normalizePendingPlanChange(empresaId, Instant.now());
        if (pendingStatus.pending() != null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Ya tienes un cambio de plan pendiente de pago. Cuando se confirme el pago, aplicaremos el nuevo plan automáticamente.",
                    PlanBlockCodes.CAMBIO_PENDIENTE_PAGO);
        }

        SaasPlan destinoPlan = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(nuevo)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no disponible o inactivo."));

        if (PlanTierOrder.isDowngrade(actualCodigo, nuevo)) {
            planEntitlementService.assertUsoCompatibleConPlanDestino(empresaId, nuevo);
            sub.setPlan(destinoPlan);
            suscripcionRepository.save(sub);
            return new CambioPlanDtos.CambioPlanSolicitudResponse(
                    "APLICADO",
                    "Tu plan se actualizó. Los módulos y límites del nuevo plan aplican de inmediato.",
                    null,
                    null,
                    nuevo);
        }

        if (PlanTierOrder.isUpgrade(actualCodigo, nuevo)) {
            Instant now = Instant.now();
            Empresa empresa = sub.getEmpresa();
            SaasCompra compra = SaasCompra.builder()
                    .empresa(empresa)
                    .suscripcion(sub)
                    .tipo(SaasCompraTipo.CAMBIO_PLAN)
                    .planDestino(destinoPlan)
                    .estado(EstadoCompra.PENDIENTE_PAGO)
                    .monto(destinoPlan.getPrecioMensual() != null ? destinoPlan.getPrecioMensual() : BigDecimal.ZERO)
                    .moneda(destinoPlan.getMoneda() != null ? destinoPlan.getMoneda() : "COP")
                    .createdAt(now)
                    .build();
            compra = saasCompraRepository.save(compra);
            SaasPago pago = SaasPago.builder()
                    .compra(compra)
                    .estado(EstadoPago.PENDIENTE)
                    .proveedor(PlanChangePendingCloseReason.SAAS_PAGO_PROVEEDOR_CAMBIO_PLAN)
                    .createdAt(now)
                    .build();
            pago = saasPagoRepository.save(pago);
            return new CambioPlanDtos.CambioPlanSolicitudResponse(
                    "PENDIENTE_PAGO",
                    "Requiere pago. Cuando el pago se confirme, tu nuevo plan quedará activo. "
                            + "Mientras tanto sigues con tu plan actual.",
                    compra.getId(),
                    pago.getId(),
                    nuevo);
        }

        throw new BusinessException(HttpStatus.BAD_REQUEST, "No se pudo procesar el cambio de plan solicitado.");
    }

    @Transactional(rollbackFor = Exception.class)
    public CambioPlanDtos.CambioPlanCancelacionResponse cancelarCambioPendiente(Long empresaId) {
        PendingPlanStatus pendingStatus = normalizePendingPlanChange(empresaId, Instant.now());
        PendingPlanChange pending = pendingStatus.pending();
        if (pending == null) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "No tienes un cambio de plan pendiente para cancelar en este momento.");
        }
        SaasCompra compra = saasCompraRepository.findById(pending.compraId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "No se encontró la compra del cambio de plan."));
        SaasPago pago = saasPagoRepository.findById(pending.pagoId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "No se encontró el pago pendiente del cambio de plan."));
        cancelPendingPlanChange(compra, PlanChangePendingCloseReason.CANCELADO_USUARIO);
        return new CambioPlanDtos.CambioPlanCancelacionResponse(
                "CANCELADO",
                "Este cambio de plan fue cancelado. Tu plan actual no ha cambiado y ya puedes iniciar otro cambio cuando quieras.",
                compra.getId(),
                pago.getId());
    }

    private PendingPlanStatus normalizePendingPlanChange(Long empresaId, Instant now) {
        Optional<SaasCompra> compraOpt =
                saasCompraRepository.findFirstByEmpresa_IdAndEstadoOrderByIdDesc(empresaId, EstadoCompra.PENDIENTE_PAGO);
        if (compraOpt.isEmpty()) {
            return new PendingPlanStatus(null, null);
        }
        SaasCompra compra = compraOpt.get();
        if (compra.getTipo() != SaasCompraTipo.CAMBIO_PLAN && compra.getTipo() != SaasCompraTipo.ONBOARDING) {
            return new PendingPlanStatus(null, null);
        }
        Instant createdAt = compra.getCreatedAt() != null ? compra.getCreatedAt() : now;
        Instant expiresAt = createdAt.plusSeconds(safeTtlHours() * 3600);
        if (!now.isBefore(expiresAt)) {
            cancelPendingPlanChange(compra, PlanChangePendingCloseReason.EXPIRADO_SISTEMA);
            return new PendingPlanStatus(null, "El cambio pendiente expiró y puedes iniciar uno nuevo.");
        }
        Optional<SaasPago> pagoOpt = saasPagoRepository.findFirstByCompra_IdAndEstadoOrderByIdDesc(compra.getId(), EstadoPago.PENDIENTE);
        if (pagoOpt.isEmpty()) {
            cancelPendingPlanChange(compra, PlanChangePendingCloseReason.PENDIENTE_SIN_PAGO);
            return new PendingPlanStatus(
                    null,
                    "Se liberó un cambio pendiente incompleto. Tu plan actual no cambió y ya puedes solicitar otro cambio.");
        }
        SaasPlan destino = compra.getPlanDestino();
        return new PendingPlanStatus(new PendingPlanChange(
                compra.getId(),
                pagoOpt.get().getId(),
                destino != null ? destino.getCodigo() : null,
                destino != null ? destino.getNombre() : null,
                createdAt,
                expiresAt), null);
    }

    private void cancelPendingPlanChange(SaasCompra compra, String reason) {
        List<SaasPago> pendingPagos = saasPagoRepository.findByCompra_IdAndEstado(compra.getId(), EstadoPago.PENDIENTE);
        for (SaasPago p : pendingPagos) {
            p.setEstado(EstadoPago.RECHAZADO);
            p.setConfirmationChannel(reason);
            p.setPayloadAudit("Cambio de plan pendiente cerrado por sistema. Motivo: " + reason);
        }
        if (!pendingPagos.isEmpty()) {
            saasPagoRepository.saveAll(pendingPagos);
        }
        compra.setEstado(EstadoCompra.CANCELADA);
        saasCompraRepository.save(compra);
    }

    private long safeTtlHours() {
        return planChangePendingTtlHours > 0 ? planChangePendingTtlHours : 72;
    }
}

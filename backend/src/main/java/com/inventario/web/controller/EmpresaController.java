package com.inventario.web.controller;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Suscripcion;
import com.inventario.domain.repository.SuscripcionRepository;
import com.inventario.service.catalog.EmpresaProfileService;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.service.saas.PlanEntitlements;
import com.inventario.service.saas.SubscriptionPlanChangeService;
import com.inventario.web.dto.EmpresaMiDtos.EmpresaMiUpdateRequest;
import com.inventario.web.dto.empresa.CambioPlanDtos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/empresa")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class EmpresaController {

    private final EmpresaProfileService empresaProfileService;
    private final SuscripcionRepository suscripcionRepository;
    private final PlanEntitlementService planEntitlementService;
    private final SubscriptionPlanChangeService subscriptionPlanChangeService;

    public record EmpresaActualResponse(
            Long id,
            String nombre,
            String identificacion,
            String emailContacto,
            String telefono,
            String estado,
            String planCodigo,
            String planNombre,
            String suscripcionEstado,
            List<String> modulosHabilitados,
            Integer maxUsuarios,
            Integer maxBodegas,
            Integer maxProductos,
            Long cambioPlanPendientePagoId,
            String cambioPlanPendientePlanCodigo,
            String cambioPlanPendientePlanNombre,
            Instant cambioPlanPendienteCreadoAt,
            Instant cambioPlanPendienteExpiraAt,
            String cambioPlanMensaje
    ) {}

    @GetMapping("/mi")
    @Operation(summary = "Empresa del usuario autenticado")
    public EmpresaActualResponse miEmpresa() {
        Empresa e = empresaProfileService.miEmpresa();
        Suscripcion s = suscripcionRepository.findByEmpresaId(e.getId()).orElse(null);
        PlanEntitlements ent = planEntitlementService.resolveForEmpresa(e.getId());
        var pendingStatus = subscriptionPlanChangeService.pendingPlanStatusForEmpresa(e.getId());
        return toResponse(e, s, ent, pendingStatus.pending(), pendingStatus.notice());
    }

    @PutMapping("/mi")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar datos básicos de la empresa del usuario (sin cambiar identificación tributaria)")
    public EmpresaActualResponse actualizarMiEmpresa(@Valid @RequestBody EmpresaMiUpdateRequest req) {
        Empresa e = empresaProfileService.actualizarMiEmpresa(req);
        Suscripcion s = suscripcionRepository.findByEmpresaId(e.getId()).orElse(null);
        PlanEntitlements ent = planEntitlementService.resolveForEmpresa(e.getId());
        var pendingStatus = subscriptionPlanChangeService.pendingPlanStatusForEmpresa(e.getId());
        return toResponse(e, s, ent, pendingStatus.pending(), pendingStatus.notice());
    }

    @PostMapping("/cambio-plan")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Solicitar cambio de plan (upgrade con pago o downgrade inmediato si aplica)")
    public CambioPlanDtos.CambioPlanSolicitudResponse solicitarCambioPlan(@Valid @RequestBody CambioPlanDtos.CambioPlanSolicitudRequest req) {
        Empresa e = empresaProfileService.miEmpresa();
        return subscriptionPlanChangeService.solicitarCambio(e.getId(), req.planCodigo());
    }

    @PostMapping("/cambio-plan/cancelar")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Cancelar cambio de plan pendiente de pago")
    public CambioPlanDtos.CambioPlanCancelacionResponse cancelarCambioPlanPendiente() {
        Empresa e = empresaProfileService.miEmpresa();
        return subscriptionPlanChangeService.cancelarCambioPendiente(e.getId());
    }

    private static EmpresaActualResponse toResponse(
            Empresa e,
            Suscripcion s,
            PlanEntitlements ent,
            SubscriptionPlanChangeService.PendingPlanChange pend,
            String cambioPlanMensaje) {
        ArrayList<String> mods = new ArrayList<>(ent.modulos());
        Collections.sort(mods);
        return new EmpresaActualResponse(
                e.getId(),
                e.getNombre(),
                e.getIdentificacion(),
                e.getEmailContacto(),
                e.getTelefono(),
                e.getEstado() != null ? e.getEstado().name() : null,
                s != null && s.getPlan() != null ? s.getPlan().getCodigo() : null,
                s != null && s.getPlan() != null ? s.getPlan().getNombre() : null,
                s != null && s.getEstado() != null ? s.getEstado().name() : null,
                List.copyOf(mods),
                ent.maxUsuarios(),
                ent.maxBodegas(),
                ent.maxProductos(),
                pend != null ? pend.pagoId() : null,
                pend != null ? pend.planCodigoDestino() : null,
                pend != null ? pend.planNombreDestino() : null,
                pend != null ? pend.createdAt() : null,
                pend != null ? pend.expiresAt() : null,
                cambioPlanMensaje
        );
    }
}

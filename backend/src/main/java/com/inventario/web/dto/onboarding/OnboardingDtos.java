package com.inventario.web.dto.onboarding;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public final class OnboardingDtos {

    private OnboardingDtos() {}

    public record OnboardingRegisterRequest(
            @NotBlank @Size(max = 40) String planCodigo,
            @Valid @NotNull EmpresaOnboardingDto empresa,
            @Valid @NotNull SuperAdminOnboardingDto superAdmin) {}

    public record EmpresaOnboardingDto(
            @NotBlank @Size(max = 200) String nombre,
            @NotBlank @Size(max = 32) String identificacion,
            @Size(max = 100) String sector,
            @NotBlank @Email @Size(max = 255) String emailContacto,
            @Size(max = 40) String telefono,
            @Size(max = 80) String pais,
            @Size(max = 120) String ciudad) {}

    public record SuperAdminOnboardingDto(
            @NotBlank @Size(max = 100) String nombre,
            @NotBlank @Size(max = 100) String apellido,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 128) String password,
            @NotBlank String confirmPassword) {}

    /**
     * Catálogo público de plan (landing, onboarding y recomendación contextual).
     *
     * Campos estructurados añadidos:
     *  - {@code modulos}: códigos técnicos de {@code PlanEntitlementCodes} proyectados
     *    desde {@code PlanEntitlementsRegistry} (fuente única). Ordenados y no-null.
     *  - {@code maxProductos}: tope de productos del plan; {@code null} = ilimitado.
     *
     * {@code maxBodegas} y {@code maxUsuarios} se mantienen como {@code int} primitivo
     * por retrocompatibilidad con landing/onboarding existente (no se cambia su tipo).
     */
    public record PublicPlanResponse(
            String id,
            String codigo,
            String nombre,
            String descripcionCorta,
            BigDecimal precio,
            String descripcion,
            BigDecimal precioMensual,
            String moneda,
            int maxBodegas,
            int maxUsuarios,
            List<String> features,
            boolean recomendado,
            String tipo,
            List<String> modulos,
            Integer maxProductos) {}

    public record OnboardingRegisterResponse(
            Long empresaId,
            String empresaNombre,
            Long usuarioId,
            String superAdminEmail,
            String planCodigo,
            String planNombre,
            String suscripcionEstado,
            String empresaEstadoComercial,
            String activationOutcome,
            String purchasePin,
            String nextStep,
            String message,
            /** Solo si activation es pendiente de pago: referencia para webhook o confirmación manual. */
            Long compraId,
            Long pagoId) {}
}

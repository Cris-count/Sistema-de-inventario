package com.inventario.web.dto.onboarding;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OnboardingDtos {

    private OnboardingDtos() {}

    public record SendEmailVerificationRequest(
            @NotBlank @Email @Size(max = 255) String email, @NotBlank @Size(max = 40) String planCodigo) {}

    public record SendEmailVerificationResponse(String message, Instant codeExpiresAt) {}

    public record VerifyEmailRequest(
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 40) String planCodigo,
            @NotBlank @Pattern(regexp = "\\d{6}") String code) {}

    public record VerifyEmailResponse(String verificationToken, Instant sessionExpiresAt, String message) {}

    public record OnboardingRegisterRequest(
            @NotBlank @Size(max = 40) String planCodigo,
            @NotBlank @Size(max = 48) String emailVerificationToken,
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

    public record PublicPlanResponse(
            String codigo,
            String nombre,
            String descripcion,
            BigDecimal precioMensual,
            String moneda,
            int maxBodegas,
            int maxUsuarios,
            List<String> features) {}

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
            Long pagoId,
            String totpOtpauthUri,
            String totpSecretBase32) {}
}

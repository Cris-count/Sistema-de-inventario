package com.inventario.service.onboarding;

import com.inventario.domain.entity.OnboardingEmailChallenge;
import com.inventario.domain.entity.SaasPlan;
import com.inventario.domain.repository.OnboardingEmailChallengeRepository;
import com.inventario.domain.repository.SaasPlanRepository;
import com.inventario.service.mfa.MfaTotpService;
import com.inventario.web.dto.onboarding.OnboardingDtos.SendEmailVerificationResponse;
import com.inventario.web.dto.onboarding.OnboardingDtos.VerifyEmailResponse;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OnboardingEmailVerificationService {

    private final OnboardingEmailChallengeRepository challengeRepository;
    private final SaasPlanRepository saasPlanRepository;
    private final TotpOnboardingService totpOnboardingService;
    private final MfaTotpService mfaTotpService;

    @Value("${app.onboarding.email-code-ttl-minutes:15}")
    private int codeTtlMinutes;

    @Value("${app.onboarding.email-session-ttl-hours:24}")
    private int sessionTtlHours;

    /**
     * Inicia o reutiliza un reto TOTP para el correo y plan: no envía correo.
     * Si ya hay un reto pendiente y vigente con secreto, devuelve el mismo otpauth (sin rotar).
     */
    @Transactional
    public SendEmailVerificationResponse sendVerificationCode(String emailRaw, String planCodigoRaw) {
        String email = emailRaw.trim().toLowerCase(Locale.ROOT);
        String planCodigo = planCodigoRaw.trim();
        saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(planCodigo)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no válido o inactivo"));

        var existingOpt = challengeRepository.findTopByEmailIgnoreCaseAndPlanCodigoIgnoreCaseAndStatusOrderByCreatedAtDesc(
                email, planCodigo, OnboardingEmailChallenge.STATUS_PENDING);

        if (existingOpt.isPresent()) {
            OnboardingEmailChallenge ex = existingOpt.get();
            if (ex.getExpiresAt().isAfter(Instant.now())) {
                String secret = ex.getTotpSecret();
                if (secret != null && !secret.isBlank()) {
                    String uri = totpOnboardingService.buildOtpauthUri(secret, email);
                    return new SendEmailVerificationResponse(
                            "Escanea el código QR con Google Authenticator o añade la cuenta manualmente.",
                            ex.getExpiresAt(),
                            uri);
                }
            }
            challengeRepository.cancelPendingForEmailAndPlan(email, planCodigo);
        }

        String secret = mfaTotpService.generateSecretBase32();
        Instant now = Instant.now();
        Instant expires = now.plus(codeTtlMinutes, ChronoUnit.MINUTES);

        OnboardingEmailChallenge row = OnboardingEmailChallenge.builder()
                .email(email)
                .planCodigo(planCodigo)
                .codeHash(null)
                .totpSecret(secret)
                .expiresAt(expires)
                .status(OnboardingEmailChallenge.STATUS_PENDING)
                .createdAt(now)
                .build();
        challengeRepository.save(row);

        String uri = totpOnboardingService.buildOtpauthUri(secret, email);
        return new SendEmailVerificationResponse(
                "Escanea el código QR con Google Authenticator o añade la cuenta manualmente.", expires, uri);
    }

    @Transactional
    public VerifyEmailResponse verifyCode(String emailRaw, String planCodigoRaw, String codeRaw) {
        String email = emailRaw.trim().toLowerCase(Locale.ROOT);
        String planCodigo = planCodigoRaw.trim();
        String code = codeRaw.replaceAll("\\s+", "");
        if (code.length() != 6 || !code.chars().allMatch(Character::isDigit)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El código debe ser de 6 dígitos");
        }

        OnboardingEmailChallenge row = challengeRepository
                .findTopByEmailIgnoreCaseAndPlanCodigoIgnoreCaseAndStatusOrderByCreatedAtDesc(
                        email, planCodigo, OnboardingEmailChallenge.STATUS_PENDING)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "No hay una verificación pendiente para este correo y plan"));

        if (row.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La verificación expiró; genera el código QR de nuevo");
        }

        boolean ok;
        if (row.getTotpSecret() != null && !row.getTotpSecret().isBlank()) {
            ok = mfaTotpService.verify(row.getTotpSecret(), code);
        } else if (row.getCodeHash() != null && !row.getCodeHash().isBlank()) {
            String hash = sha256Hex(code);
            byte[] expected = HexFormat.of().parseHex(row.getCodeHash());
            byte[] actual = HexFormat.of().parseHex(hash);
            ok = MessageDigest.isEqual(expected, actual);
        } else {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Configuración de verificación inválida");
        }

        if (!ok) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Código incorrecto");
        }

        Instant now = Instant.now();
        UUID sessionToken = UUID.randomUUID();
        Instant sessionExpires = now.plus(sessionTtlHours, ChronoUnit.HOURS);

        row.setStatus(OnboardingEmailChallenge.STATUS_VERIFIED);
        row.setTotpSecret(null);
        row.setSessionToken(sessionToken);
        row.setSessionExpiresAt(sessionExpires);
        challengeRepository.save(row);

        return new VerifyEmailResponse(
                sessionToken.toString(),
                sessionExpires,
                "Verificación completada. Puedes continuar con los datos de la empresa.");
    }

    private static String sha256Hex(String input) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }
}

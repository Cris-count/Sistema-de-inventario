package com.inventario.service.onboarding;

import com.inventario.domain.entity.OnboardingEmailChallenge;
import com.inventario.domain.entity.SaasPlan;
import com.inventario.domain.repository.OnboardingEmailChallengeRepository;
import com.inventario.domain.repository.SaasPlanRepository;
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
import java.security.SecureRandom;
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
    private final OnboardingMailNotificationService mailNotificationService;

    @Value("${app.onboarding.email-code-ttl-minutes:15}")
    private int codeTtlMinutes;

    @Value("${app.onboarding.email-session-ttl-hours:24}")
    private int sessionTtlHours;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public SendEmailVerificationResponse sendVerificationCode(String emailRaw, String planCodigoRaw) {
        String email = emailRaw.trim().toLowerCase(Locale.ROOT);
        String planCodigo = planCodigoRaw.trim();
        SaasPlan plan = saasPlanRepository
                .findByCodigoIgnoreCaseAndActivoIsTrue(planCodigo)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "Plan no válido o inactivo"));

        challengeRepository.cancelPendingForEmailAndPlan(email, planCodigo);

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        String hash = sha256Hex(code);
        Instant now = Instant.now();
        Instant expires = now.plus(codeTtlMinutes, ChronoUnit.MINUTES);

        OnboardingEmailChallenge row = OnboardingEmailChallenge.builder()
                .email(email)
                .planCodigo(planCodigo)
                .codeHash(hash)
                .expiresAt(expires)
                .status(OnboardingEmailChallenge.STATUS_PENDING)
                .createdAt(now)
                .build();
        challengeRepository.save(row);

        mailNotificationService.sendEmailVerificationCode(email, code, plan.getNombre());

        return new SendEmailVerificationResponse(
                "Si el correo es válido, recibirás un código de verificación.", expires);
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
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST, "No hay un código pendiente para este correo y plan"));

        if (row.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "El código expiró; solicita uno nuevo");
        }

        String hash = sha256Hex(code);
        byte[] expected = HexFormat.of().parseHex(row.getCodeHash());
        byte[] actual = HexFormat.of().parseHex(hash);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Código incorrecto");
        }

        Instant now = Instant.now();
        UUID sessionToken = UUID.randomUUID();
        Instant sessionExpires = now.plus(sessionTtlHours, ChronoUnit.HOURS);

        row.setStatus(OnboardingEmailChallenge.STATUS_VERIFIED);
        row.setSessionToken(sessionToken);
        row.setSessionExpiresAt(sessionExpires);
        challengeRepository.save(row);

        return new VerifyEmailResponse(
                sessionToken.toString(),
                sessionExpires,
                "Correo verificado. Puedes continuar con los datos de la empresa.");
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

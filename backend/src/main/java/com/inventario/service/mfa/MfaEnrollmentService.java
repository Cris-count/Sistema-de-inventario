package com.inventario.service.mfa;

import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.web.dto.auth.MfaDisableRequest;
import com.inventario.web.dto.auth.MfaEnableRequest;
import com.inventario.web.dto.auth.MfaSetupResponse;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MfaEnrollmentService {

    private final CurrentUserService currentUserService;
    private final UsuarioRepository usuarioRepository;
    private final MfaTotpService totpService;
    private final AuthenticationManager authenticationManager;
    private final MfaBackupCodeService mfaBackupCodeService;

    @Value("${app.mfa.issuer:Inventario}")
    private String issuer;

    @Value("${app.mfa.backup-code-count:10}")
    private int backupCodeCount;

    @Transactional
    public MfaSetupResponse setup() {
        Usuario u = currentUserService.requireUsuario();
        if (u.isMfaEnabled()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "El segundo factor ya está activado. Desactívalo antes de generar un nuevo secreto.",
                    MfaBlockCodes.MFA_ALREADY_ENABLED);
        }
        String secret = totpService.generateSecretBase32();
        u.setMfaSecret(secret);
        u.setMfaEnabled(false);
        usuarioRepository.save(u);
        usuarioRepository.flush();
        List<String> backups = mfaBackupCodeService.replaceCodesForUser(u, backupCodeCount);
        return new MfaSetupResponse(secret, buildOtpauthUri(u.getEmail(), secret), issuer.trim(), List.copyOf(backups));
    }

    @Transactional
    public void enable(MfaEnableRequest req) {
        Usuario u = currentUserService.requireUsuario();
        if (u.isMfaEnabled()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "El segundo factor ya está activo.",
                    MfaBlockCodes.MFA_ALREADY_ENABLED);
        }
        if (u.getMfaSecret() == null || u.getMfaSecret().isBlank()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Primero debes generar el secreto (setup) y registrar la cuenta en tu autenticador.",
                    MfaBlockCodes.MFA_SETUP_REQUIRED);
        }
        if (!totpService.verify(u.getMfaSecret(), req.code())) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED,
                    "Código de verificación incorrecto.",
                    MfaBlockCodes.MFA_INVALID_CODE);
        }
        u.setMfaEnabled(true);
        usuarioRepository.save(u);
    }

    @Transactional
    public void disable(MfaDisableRequest req) {
        Usuario u = currentUserService.requireUsuario();
        if (!u.isMfaEnabled()) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "El segundo factor no está activado.",
                    MfaBlockCodes.MFA_NOT_ENABLED);
        }
        if (u.getMfaSecret() == null || u.getMfaSecret().isBlank()) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Configuración MFA inconsistente. Contacta a soporte.",
                    MfaBlockCodes.MFA_SETUP_REQUIRED);
        }
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(u.getEmail(), req.password()));
        if (!totpService.verify(u.getMfaSecret(), req.code())) {
            throw new BusinessException(
                    HttpStatus.UNAUTHORIZED,
                    "Código de verificación incorrecto.",
                    MfaBlockCodes.MFA_INVALID_CODE);
        }
        mfaBackupCodeService.deleteAllForUser(u.getId());
        u.setMfaEnabled(false);
        u.setMfaSecret(null);
        usuarioRepository.save(u);
    }

    private String buildOtpauthUri(String email, String secret) {
        String iss = issuer.trim();
        String label = enc(iss + ":" + email);
        return "otpauth://totp/"
                + label
                + "?secret="
                + secret
                + "&issuer="
                + enc(iss)
                + "&algorithm=SHA1&digits=6&period=30";
    }

    private static String enc(String raw) {
        return URLEncoder.encode(raw, StandardCharsets.UTF_8).replace("+", "%20");
    }
}

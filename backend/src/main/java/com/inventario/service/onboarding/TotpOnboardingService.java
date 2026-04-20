package com.inventario.service.onboarding;

import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class TotpOnboardingService {

    private static final String ISSUER = "Inventario Pro";

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();

    public String generateBase32Secret() {
        return secretGenerator.generate();
    }

    /**
     * URI otpauth compatible con Google Authenticator y apps TOTP estándar (SHA1, 6 dígitos, 30 s).
     */
    public String buildOtpauthUri(String base32Secret, String accountEmail) {
        String label = ISSUER + ":" + accountEmail.trim();
        String encLabel = URLEncoder.encode(label, StandardCharsets.UTF_8);
        String encIssuer = URLEncoder.encode(ISSUER, StandardCharsets.UTF_8);
        return "otpauth://totp/"
                + encLabel
                + "?secret="
                + base32Secret
                + "&issuer="
                + encIssuer
                + "&algorithm=SHA1&digits=6&period=30";
    }
}

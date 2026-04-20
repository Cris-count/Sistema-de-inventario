package com.inventario.service.mfa;

import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import org.springframework.stereotype.Service;

/**
 * TOTP RFC 6238 compatible con Google Authenticator (SHA1, 6 dígitos, 30 s).
 * Ventana ±1 intervalo vía {@link DefaultCodeVerifier#setAllowedTimePeriodDiscrepancy(int)}.
 */
@Service
public class MfaTotpService {

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier verifier;

    public MfaTotpService() {
        var generator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        DefaultCodeVerifier v = new DefaultCodeVerifier(generator, new SystemTimeProvider());
        v.setAllowedTimePeriodDiscrepancy(1);
        this.verifier = v;
    }

    public String generateSecretBase32() {
        return secretGenerator.generate();
    }

    public boolean verify(String secretBase32, String sixDigitCode) {
        if (secretBase32 == null || secretBase32.isBlank() || sixDigitCode == null || sixDigitCode.isBlank()) {
            return false;
        }
        return verifier.isValidCode(secretBase32, sixDigitCode);
    }
}

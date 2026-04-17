package com.inventario.config;

import com.inventario.audit.AuthAuditLogger;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Endurece producción: con {@code pepperRequired=true} exige {@code REFRESH_TOKEN_PEPPER} no vacío.
 */
@Component
@RequiredArgsConstructor
public class RefreshTokenPepperStartupValidator implements ApplicationRunner {

    private final RefreshTokenProperties refreshTokenProperties;
    private final AuthAuditLogger authAuditLogger;

    @Override
    public void run(ApplicationArguments args) {
        if (!refreshTokenProperties.isPepperRequired()) {
            return;
        }
        String p = refreshTokenProperties.getHashPepper();
        if (p == null || p.isBlank()) {
            authAuditLogger.refreshPepperMissingOnStartup();
            throw new IllegalStateException(
                    "app.refresh-token.pepper-required=true pero REFRESH_TOKEN_PEPPER / app.refresh-token.hash-pepper "
                            + "está vacío. Defina un pepper fuerte en el entorno (producción).");
        }
    }
}

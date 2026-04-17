package com.inventario.service.mfa;

/**
 * Estado del desafío MFA (intentos, consumo único) compartible entre instancias.
 * Implementaciones: {@link InMemoryMfaChallengeStateStore}, {@link JpaMfaChallengeStateStore}.
 */
public interface MfaChallengeStateStore {

    /**
     * Tras validar JWT de challenge; crea el registro si no existe (primera petición con este {@code jti}).
     *
     * @param userEmailNormalized email del {@code sub} del challenge (se compara con el almacenado por {@code jti})
     */
    void assertChallengeUsable(String jti, String userEmailNormalized);

    void registerInvalidTotp(String jti, String userEmailNormalized);

    void consumeSuccessfully(String jti, String userEmailNormalized);
}

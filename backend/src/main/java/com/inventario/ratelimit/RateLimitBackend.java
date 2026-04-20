package com.inventario.ratelimit;

import java.util.OptionalInt;

/**
 * Contador distribuible de límites por ventana fija. Implementaciones: {@link InMemoryFixedWindowRateLimitBackend},
 * {@link RedisFixedWindowRateLimitBackend} (vía {@link RateLimitConfiguration}).
 */
public interface RateLimitBackend {

    /**
     * Registra un intento en el cubo {@code namespace + ":" + bucketKey}.
     *
     * @return vacío si el intento está permitido; si se rechaza, segundos sugeridos hasta el fin de ventana ({@code Retry-After}).
     */
    OptionalInt recordAndGetRetryAfterSeconds(String namespace, String bucketKey, int maxRequests, int windowSeconds);
}

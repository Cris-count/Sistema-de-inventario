package com.inventario.ratelimit;

/** Implementación física del contador de {@link RateLimitBackend}. */
public enum RateLimitBackendType {
    /** Ventana fija en JVM (desarrollo, tests, fallback). */
    MEMORY,
    /** Ventana fija en Redis (clúster multiinstancia). */
    REDIS
}

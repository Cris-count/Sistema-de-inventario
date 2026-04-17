package com.inventario.ratelimit;

/**
 * Códigos expuestos en {@code ProblemDetail.blockCode} cuando se excede el límite de peticiones.
 */
public final class RateLimitBlockCodes {

    public static final String RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED";

    private RateLimitBlockCodes() {}
}

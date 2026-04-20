package com.inventario.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.OptionalInt;

/**
 * Intenta Redis y ante fallo de conexión usa memoria local (límites por JVM hasta recuperar Redis).
 * La degradación se notifica vía {@link RateLimitOperationalState} (logs WARN controlados + métricas).
 */
public class ResilientRedisRateLimitBackend implements RateLimitBackend {

    private static final Logger LOG = LoggerFactory.getLogger(ResilientRedisRateLimitBackend.class);

    private final RedisFixedWindowRateLimitBackend redis;
    private final InMemoryFixedWindowRateLimitBackend memory;
    private final RateLimitOperationalState operationalState;
    private final RateLimitProperties rateLimitProperties;

    public ResilientRedisRateLimitBackend(
            RedisFixedWindowRateLimitBackend redis,
            InMemoryFixedWindowRateLimitBackend memory,
            RateLimitOperationalState operationalState,
            RateLimitProperties rateLimitProperties) {
        this.redis = redis;
        this.memory = memory;
        this.operationalState = operationalState;
        this.rateLimitProperties = rateLimitProperties;
    }

    @Override
    public OptionalInt recordAndGetRetryAfterSeconds(String namespace, String bucketKey, int maxRequests, int windowSeconds) {
        try {
            OptionalInt r = redis.recordAndGetRetryAfterSeconds(namespace, bucketKey, maxRequests, windowSeconds);
            operationalState.recordRedisRequestSuccess();
            return r;
        } catch (RuntimeException e) {
            if (!isLikelyRedisFailure(e)) {
                throw e;
            }
            if (!rateLimitProperties.isAllowMemoryFallbackOnRedisFailure()) {
                LOG.error("Rate limiting: Redis falló y app.rate-limit.allow-memory-fallback-on-redis-failure=false; propagando error.");
                throw e;
            }
            operationalState.recordRedisUnavailableUsedMemoryFallback(e);
            if (LOG.isDebugEnabled()) {
                LOG.debug("Rate limit Redis excepción (detalle): {}", e.toString());
            }
            return memory.recordAndGetRetryAfterSeconds(namespace, bucketKey, maxRequests, windowSeconds);
        }
    }

    private static boolean isLikelyRedisFailure(Throwable e) {
        Throwable cur = e;
        int depth = 0;
        while (cur != null && depth++ < 8) {
            String name = cur.getClass().getName();
            if (name.startsWith("org.springframework.data.redis")
                    || name.startsWith("io.lettuce.core")
                    || name.startsWith("io.netty")) {
                return true;
            }
            cur = cur.getCause();
        }
        return false;
    }
}

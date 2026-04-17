package com.inventario.ratelimit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

/**
 * Expone el modo efectivo del rate limiting en {@code /actuator/health} (componente {@code rateLimiting}).
 */
@Component("rateLimiting")
public class RateLimitingHealthIndicator implements HealthIndicator {

    private static final Status DEGRADED = new Status("DEGRADED");
    private static final Status MISCONFIGURED = new Status("MISCONFIGURED");

    private final RateLimitProperties properties;
    private final RateLimitOperationalState operationalState;
    private final StringRedisTemplate rateLimitRedisTemplate;

    private volatile long lastPingWallMs = 0L;
    private volatile Boolean lastPingOk;

    private static final long PING_CACHE_MS = 5_000L;

    public RateLimitingHealthIndicator(
            RateLimitProperties properties,
            RateLimitOperationalState operationalState,
            @Autowired(required = false) @Qualifier("rateLimitStringRedisTemplate")
                    StringRedisTemplate rateLimitRedisTemplate) {
        this.properties = properties;
        this.operationalState = operationalState;
        this.rateLimitRedisTemplate = rateLimitRedisTemplate;
    }

    @Override
    public Health health() {
        if (!properties.isEnabled()) {
            return Health.up()
                    .withDetail("enabled", false)
                    .withDetail("message", "Rate limiting desactivado")
                    .build();
        }

        if (properties.getBackend() == RateLimitBackendType.MEMORY) {
            return Health.up()
                    .withDetail("configuredBackend", "memory")
                    .withDetail("effectiveStore", "LOCAL_JVM")
                    .withDetail("distributed", false)
                    .withDetail("fallbackActivationsTotal", operationalState.getFallbackActivationsTotal())
                    .build();
        }

        if (rateLimitRedisTemplate == null) {
            return Health.status(MISCONFIGURED)
                    .withDetail("configuredBackend", "redis")
                    .withDetail("effectiveStore", "LOCAL_JVM")
                    .withDetail("reason", "Sin bean Redis (host vacío o condición no cumplida)")
                    .withDetail("distributed", false)
                    .build();
        }

        boolean pingOk = pingRedisCached();
        boolean pathDegraded = operationalState.isRequestPathDegraded();

        if (!pingOk) {
            return Health.status(DEGRADED)
                    .withDetail("configuredBackend", "redis")
                    .withDetail("redisPing", "DOWN")
                    .withDetail("requestPathDegraded", pathDegraded)
                    .withDetail("effectiveStore", "LOCAL_JVM_OR_UNKNOWN")
                    .withDetail("distributed", false)
                    .withDetail("fallbackActivationsTotal", operationalState.getFallbackActivationsTotal())
                    .withDetail("redisRecoveryEvents", operationalState.getRedisRecoveryEvents())
                    .withDetail("message", "Redis no responde al ping; el tráfico puede estar en memoria por instancia")
                    .build();
        }

        if (pathDegraded) {
            return Health.status(DEGRADED)
                    .withDetail("configuredBackend", "redis")
                    .withDetail("redisPing", "UP")
                    .withDetail("requestPathDegraded", true)
                    .withDetail("effectiveStore", "MIXED_REDIS_UP_BUT_RECENT_MEMORY_FALLBACK")
                    .withDetail("distributed", false)
                    .withDetail("fallbackActivationsTotal", operationalState.getFallbackActivationsTotal())
                    .withDetail("redisRecoveryEvents", operationalState.getRedisRecoveryEvents())
                    .withDetail(
                            "message",
                            "Redis responde al ping pero hubo fallos recientes en el camino de petición (memoria por instancia)")
                    .build();
        }

        return Health.up()
                .withDetail("configuredBackend", "redis")
                .withDetail("redisPing", "UP")
                .withDetail("requestPathDegraded", false)
                .withDetail("effectiveStore", "REDIS_DISTRIBUTED")
                .withDetail("distributed", true)
                .withDetail("fallbackActivationsTotal", operationalState.getFallbackActivationsTotal())
                .withDetail("redisRecoveryEvents", operationalState.getRedisRecoveryEvents())
                .build();
    }

    private boolean pingRedisCached() {
        long now = System.currentTimeMillis();
        Boolean cached = lastPingOk;
        if (cached != null && now - lastPingWallMs < PING_CACHE_MS) {
            return cached;
        }
        synchronized (this) {
            if (lastPingOk != null && now - lastPingWallMs < PING_CACHE_MS) {
                return lastPingOk;
            }
            boolean ok = false;
            try (RedisConnection c = rateLimitRedisTemplate.getRequiredConnectionFactory().getConnection()) {
                ok = "PONG".equals(c.ping());
            } catch (RuntimeException ignored) {
                ok = false;
            }
            lastPingOk = ok;
            lastPingWallMs = System.currentTimeMillis();
            return ok;
        }
    }
}

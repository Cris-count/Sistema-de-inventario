package com.inventario.ratelimit;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Estado operativo del rate limiting: degradación Redis → memoria, contadores y logging acotado.
 * No expone secretos ni claves de cubo.
 */
@Component
public class RateLimitOperationalState {

    private static final Logger LOG = LoggerFactory.getLogger(RateLimitOperationalState.class);

    /** Aviso periódico mientras siga degradado (evita spam). */
    private static final long DEGRADED_PERIODIC_WARN_MS = 300_000L;

    public enum ConfigurationTarget {
        /** {@code app.rate-limit.backend=memory}. */
        LOCAL_MEMORY,
        /** Redis con beans creados. */
        DISTRIBUTED_REDIS,
        /** Se pidió redis pero no hay host/beans; el {@link RateLimitBackend} efectivo es memoria. */
        REDIS_MISCONFIGURED_USING_MEMORY
    }

    private final AtomicReference<ConfigurationTarget> configurationTarget =
            new AtomicReference<>(ConfigurationTarget.LOCAL_MEMORY);

    /** True si el último camino de petición usó memoria por fallo Redis (solo con Resilient). */
    private final AtomicBoolean requestPathDegraded = new AtomicBoolean(false);

    private final AtomicLong fallbackActivationsTotal = new AtomicLong();
    private final AtomicLong redisRecoveryEvents = new AtomicLong();
    /** Eventos de fallback desde el último aviso periódico (solo en racha ya degradada). */
    private final AtomicLong fallbackEventsSincePeriodicWarn = new AtomicLong(0);
    private final AtomicLong lastPeriodicWarnEpochMs = new AtomicLong(0);

    private final Counter fallbackCounter;
    private final Counter recoveryCounter;

    public RateLimitOperationalState(MeterRegistry meterRegistry) {
        this.fallbackCounter =
                Counter.builder("ratelimit.redis_fallback_total")
                        .description("Veces que una petición de rate limit usó memoria por fallo de Redis")
                        .register(meterRegistry);
        this.recoveryCounter =
                Counter.builder("ratelimit.redis_recovery_total")
                        .description("Veces que Redis volvió a responder tras haber estado degradado")
                        .register(meterRegistry);
        Gauge.builder("ratelimit.degraded", requestPathDegraded, b -> b.get() ? 1.0 : 0.0)
                .description("1 si el camino de petición reciente usa memoria por fallo Redis")
                .register(meterRegistry);
    }

    public void markLocalMemoryByConfiguration() {
        configurationTarget.set(ConfigurationTarget.LOCAL_MEMORY);
        requestPathDegraded.set(false);
    }

    public void markTargetDistributedRedis() {
        configurationTarget.set(ConfigurationTarget.DISTRIBUTED_REDIS);
    }

    public void markMisconfiguredRedisFellBackToLocal() {
        configurationTarget.set(ConfigurationTarget.REDIS_MISCONFIGURED_USING_MEMORY);
        requestPathDegraded.set(false);
    }

    public ConfigurationTarget getConfigurationTarget() {
        return configurationTarget.get();
    }

    public boolean isRequestPathDegraded() {
        return requestPathDegraded.get();
    }

    public long getFallbackActivationsTotal() {
        return fallbackActivationsTotal.get();
    }

    public long getRedisRecoveryEvents() {
        return redisRecoveryEvents.get();
    }

    /**
     * Llamado desde {@link ResilientRedisRateLimitBackend} tras un intento exitoso a Redis.
     */
    public void recordRedisRequestSuccess() {
        if (requestPathDegraded.compareAndSet(true, false)) {
            recoveryCounter.increment();
            redisRecoveryEvents.incrementAndGet();
            fallbackEventsSincePeriodicWarn.set(0);
            lastPeriodicWarnEpochMs.set(0);
            LOG.info(
                    "Rate limiting: Redis operativo de nuevo; contadores distribuidos entre instancias (fin de degradación a memoria).");
        }
    }

    /**
     * Llamado cuando una petición entra en memoria por fallo de Redis.
     */
    public void recordRedisUnavailableUsedMemoryFallback(Throwable cause) {
        fallbackActivationsTotal.incrementAndGet();
        fallbackCounter.increment();

        boolean becameDegraded = requestPathDegraded.compareAndSet(false, true);
        if (becameDegraded) {
            LOG.warn(
                    "Rate limiting DEGRADADO: Redis no utilizable; usando memoria por instancia (los límites ya no son globales). Causa: {}",
                    cause.toString());
            lastPeriodicWarnEpochMs.set(System.currentTimeMillis());
            fallbackEventsSincePeriodicWarn.set(0);
            return;
        }

        fallbackEventsSincePeriodicWarn.incrementAndGet();
        long now = System.currentTimeMillis();
        long last = lastPeriodicWarnEpochMs.get();
        if (now - last >= DEGRADED_PERIODIC_WARN_MS && lastPeriodicWarnEpochMs.compareAndSet(last, now)) {
            long logged = fallbackEventsSincePeriodicWarn.getAndSet(0);
            if (logged > 0) {
                LOG.warn(
                        "Rate limiting sigue DEGRADADO (memoria por instancia). Aprox. {} peticiones con fallback desde el último aviso. Comprobar Redis y red.",
                        logged);
            }
        }
    }
}

package com.inventario.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Observabilidad mínima del backend de rate limiting (sin secretos ni claves de cubo).
 */
@Component
@Order(50)
public class RateLimitBackendStartupListener implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(RateLimitBackendStartupListener.class);

    private final RateLimitProperties properties;
    private final org.springframework.beans.factory.ObjectProvider<RedisFixedWindowRateLimitBackend> redisBackend;

    public RateLimitBackendStartupListener(
            RateLimitProperties properties,
            org.springframework.beans.factory.ObjectProvider<RedisFixedWindowRateLimitBackend> redisBackend) {
        this.properties = properties;
        this.redisBackend = redisBackend;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            LOG.info("Rate limiting desactivado (app.rate-limit.enabled=false).");
            return;
        }
        if (properties.getBackend() == RateLimitBackendType.REDIS) {
            String host = properties.getRedis().getHost();
            if (host == null || host.isBlank()) {
                LOG.warn(
                        "app.rate-limit.backend=redis pero app.rate-limit.redis.host está vacío; se usa memoria local.");
                return;
            }
            if (redisBackend.getIfAvailable() != null) {
                LOG.info(
                        "Rate limiting distribuido: Redis (host={}:{}, allowMemoryFallbackOnRedisFailure={})",
                        host,
                        properties.getRedis().getPort(),
                        properties.isAllowMemoryFallbackOnRedisFailure());
            } else {
                LOG.warn(
                        "app.rate-limit.backend=redis pero no se creó el bean Redis; comprobar condición y dependencias; usando memoria local.");
            }
        } else {
            LOG.info("Rate limiting en memoria local (app.rate-limit.backend=memory).");
        }
    }
}

package com.inventario.ratelimit;

import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.core.type.AnnotatedTypeMetadata;

/**
 * Activa beans Redis solo si el operador eligió {@code redis} y definió host no vacío
 * (evita conexiones implícitas a localhost en entornos sin Redis).
 */
public class RedisRateLimitEnabledCondition implements Condition {

    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        String backend = context.getEnvironment().getProperty("app.rate-limit.backend", "memory");
        if (!"redis".equalsIgnoreCase(backend)) {
            return false;
        }
        String host = context.getEnvironment().getProperty("app.rate-limit.redis.host", "");
        return host != null && !host.isBlank();
    }
}

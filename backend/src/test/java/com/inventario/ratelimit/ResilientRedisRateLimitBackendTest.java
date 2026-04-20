package com.inventario.ratelimit;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.net.ServerSocket;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Si Redis no responde, el fallback en memoria sigue aplicando límites coherentes.
 */
class ResilientRedisRateLimitBackendTest {

    private LettuceConnectionFactory factory;

    @AfterEach
    void tearDown() {
        if (factory != null) {
            factory.destroy();
        }
    }

    @Test
    void fallsBackToMemoryWhenRedisUnreachable() throws Exception {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }

        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration();
        cfg.setHostName("127.0.0.1");
        cfg.setPort(closedPort);

        LettuceClientConfiguration client =
                LettuceClientConfiguration.builder().commandTimeout(Duration.ofMillis(200)).build();
        factory = new LettuceConnectionFactory(cfg, client);
        factory.afterPropertiesSet();

        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(factory);
        template.afterPropertiesSet();

        RedisFixedWindowRateLimitBackend redis = new RedisFixedWindowRateLimitBackend(template);
        InMemoryFixedWindowRateLimitBackend memory = new InMemoryFixedWindowRateLimitBackend();
        SimpleMeterRegistry registry = new SimpleMeterRegistry();
        RateLimitOperationalState state = new RateLimitOperationalState(registry);
        state.markTargetDistributedRedis();
        RateLimitProperties props = new RateLimitProperties();
        props.setAllowMemoryFallbackOnRedisFailure(true);
        ResilientRedisRateLimitBackend resilient = new ResilientRedisRateLimitBackend(redis, memory, state, props);

        for (int i = 0; i < 3; i++) {
            assertTrue(resilient.recordAndGetRetryAfterSeconds("fb", "k", 3, 60).isEmpty());
        }
        assertTrue(resilient.recordAndGetRetryAfterSeconds("fb", "k", 3, 60).isPresent());
    }

    @Test
    void propagatesWhenMemoryFallbackDisabled() throws Exception {
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration();
        cfg.setHostName("127.0.0.1");
        cfg.setPort(closedPort);
        LettuceClientConfiguration client =
                LettuceClientConfiguration.builder().commandTimeout(Duration.ofMillis(200)).build();
        factory = new LettuceConnectionFactory(cfg, client);
        factory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(factory);
        template.afterPropertiesSet();

        RedisFixedWindowRateLimitBackend redis = new RedisFixedWindowRateLimitBackend(template);
        InMemoryFixedWindowRateLimitBackend memory = new InMemoryFixedWindowRateLimitBackend();
        RateLimitProperties props = new RateLimitProperties();
        props.setAllowMemoryFallbackOnRedisFailure(false);
        ResilientRedisRateLimitBackend resilient =
                new ResilientRedisRateLimitBackend(
                        redis, memory, new RateLimitOperationalState(new SimpleMeterRegistry()), props);

        assertThrows(RuntimeException.class, () -> resilient.recordAndGetRetryAfterSeconds("x", "y", 1, 60));
    }
}

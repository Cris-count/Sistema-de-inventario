package com.inventario.ratelimit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.OptionalInt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
/**
 * Redis real (Testcontainers): misma semántica de ventana fija que memoria.
 */
@Testcontainers(disabledWithoutDocker = true)
class RedisFixedWindowRateLimitBackendIT {

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    private LettuceConnectionFactory connectionFactory;
    private RedisFixedWindowRateLimitBackend backend;

    @BeforeEach
    void setUp() {
        RedisStandaloneConfiguration cfg =
                new RedisStandaloneConfiguration(REDIS.getHost(), REDIS.getMappedPort(6379));
        connectionFactory = new LettuceConnectionFactory(cfg);
        connectionFactory.afterPropertiesSet();
        StringRedisTemplate template = new StringRedisTemplate();
        template.setConnectionFactory(connectionFactory);
        template.afterPropertiesSet();
        backend = new RedisFixedWindowRateLimitBackend(template);
    }

    @AfterEach
    void tearDown() {
        if (connectionFactory != null) {
            connectionFactory.destroy();
        }
    }

    @Test
    void allowsUnderLimit_sameAsMemorySemantics() {
        assertTrue(backend.recordAndGetRetryAfterSeconds("ns", "k", 3, 60).isEmpty());
        assertTrue(backend.recordAndGetRetryAfterSeconds("ns", "k", 3, 60).isEmpty());
    }

    @Test
    void rejectsWhenExceedingMax() {
        assertTrue(backend.recordAndGetRetryAfterSeconds("ns", "k", 2, 60).isEmpty());
        assertTrue(backend.recordAndGetRetryAfterSeconds("ns", "k", 2, 60).isEmpty());
        OptionalInt r = backend.recordAndGetRetryAfterSeconds("ns", "k", 2, 60);
        assertTrue(r.isPresent());
        assertTrue(r.getAsInt() >= 1);
    }

    @Test
    void namespacesAreIndependent_noCollision() {
        assertTrue(backend.recordAndGetRetryAfterSeconds("a", "same", 1, 60).isEmpty());
        assertTrue(backend.recordAndGetRetryAfterSeconds("b", "same", 1, 60).isEmpty());
        assertTrue(backend.recordAndGetRetryAfterSeconds("a", "same", 1, 60).isPresent());
    }

    @Test
    void windowExpiresAndCounterResets() throws Exception {
        assertTrue(backend.recordAndGetRetryAfterSeconds("ttl", "x", 1, 1).isEmpty());
        assertTrue(backend.recordAndGetRetryAfterSeconds("ttl", "x", 1, 1).isPresent());
        Thread.sleep(1100);
        assertTrue(backend.recordAndGetRetryAfterSeconds("ttl", "x", 1, 1).isEmpty());
    }

    @Test
    void disabledBucket_skipsLimit() {
        for (int i = 0; i < 20; i++) {
            assertTrue(backend.recordAndGetRetryAfterSeconds("x", "y", 0, 60).isEmpty());
        }
    }

    @Test
    void alignsWindowWithEpochBoundary_likeMemoryBackend() {
        InMemoryFixedWindowRateLimitBackend mem = new InMemoryFixedWindowRateLimitBackend();
        int window = 3600;
        int max = 5;
        for (int i = 0; i < max; i++) {
            assertEquals(
                    mem.recordAndGetRetryAfterSeconds("login-ip", "1.2.3.4", max, window).isEmpty(),
                    backend.recordAndGetRetryAfterSeconds("login-ip", "1.2.3.4", max, window).isEmpty());
        }
        assertEquals(
                mem.recordAndGetRetryAfterSeconds("login-ip", "1.2.3.4", max, window).isPresent(),
                backend.recordAndGetRetryAfterSeconds("login-ip", "1.2.3.4", max, window).isPresent());
    }
}

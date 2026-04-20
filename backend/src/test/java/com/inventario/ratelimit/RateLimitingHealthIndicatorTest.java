package com.inventario.ratelimit;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.Status;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RateLimitingHealthIndicatorTest {

    private RateLimitProperties properties;
    private RateLimitOperationalState state;

    @BeforeEach
    void setUp() {
        properties = new RateLimitProperties();
        properties.setEnabled(true);
        state = new RateLimitOperationalState(new SimpleMeterRegistry());
    }

    @Test
    void memoryBackend_reportsUpAndLocalJvm() {
        properties.setBackend(RateLimitBackendType.MEMORY);
        RateLimitingHealthIndicator h = new RateLimitingHealthIndicator(properties, state, null);
        Health health = h.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("configuredBackend", "memory");
        assertThat(health.getDetails()).containsEntry("distributed", false);
    }

    @Test
    void redisMisconfigured_reportsMisconfigured() {
        properties.setBackend(RateLimitBackendType.REDIS);
        RateLimitingHealthIndicator h = new RateLimitingHealthIndicator(properties, state, null);
        Health health = h.health();
        assertThat(health.getStatus().getCode()).isEqualTo("MISCONFIGURED");
        assertThat(health.getDetails()).containsEntry("distributed", false);
    }

    @Test
    void redisPingOk_reportsUpDistributed() {
        properties.setBackend(RateLimitBackendType.REDIS);
        state.markTargetDistributedRedis();
        StringRedisTemplate tpl = mock(StringRedisTemplate.class);
        RedisConnectionFactory fac = mock(RedisConnectionFactory.class);
        RedisConnection conn = mock(RedisConnection.class);
        when(tpl.getRequiredConnectionFactory()).thenReturn(fac);
        when(fac.getConnection()).thenReturn(conn);
        when(conn.ping()).thenReturn("PONG");
        RateLimitingHealthIndicator h = new RateLimitingHealthIndicator(properties, state, tpl);
        Health health = h.health();
        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("distributed", true);
        assertThat(health.getDetails()).containsEntry("effectiveStore", "REDIS_DISTRIBUTED");
    }

    @Test
    void redisPingDown_reportsDegraded() {
        properties.setBackend(RateLimitBackendType.REDIS);
        state.markTargetDistributedRedis();
        StringRedisTemplate tpl = mock(StringRedisTemplate.class);
        RedisConnectionFactory fac = mock(RedisConnectionFactory.class);
        RedisConnection conn = mock(RedisConnection.class);
        when(tpl.getRequiredConnectionFactory()).thenReturn(fac);
        when(fac.getConnection()).thenReturn(conn);
        when(conn.ping()).thenThrow(new RuntimeException("down"));
        RateLimitingHealthIndicator h = new RateLimitingHealthIndicator(properties, state, tpl);
        Health health = h.health();
        assertThat(health.getStatus().getCode()).isEqualTo("DEGRADED");
        assertThat(health.getDetails()).containsEntry("redisPing", "DOWN");
    }

    @Test
    void redisPingUpButRequestPathDegraded_reportsDegraded() {
        properties.setBackend(RateLimitBackendType.REDIS);
        state.markTargetDistributedRedis();
        state.recordRedisUnavailableUsedMemoryFallback(new RuntimeException("simulated"));
        StringRedisTemplate tpl = mock(StringRedisTemplate.class);
        RedisConnectionFactory fac = mock(RedisConnectionFactory.class);
        RedisConnection conn = mock(RedisConnection.class);
        when(tpl.getRequiredConnectionFactory()).thenReturn(fac);
        when(fac.getConnection()).thenReturn(conn);
        when(conn.ping()).thenReturn("PONG");
        RateLimitingHealthIndicator h = new RateLimitingHealthIndicator(properties, state, tpl);
        Health health = h.health();
        assertThat(health.getStatus().getCode()).isEqualTo("DEGRADED");
        assertThat(health.getDetails()).containsEntry("requestPathDegraded", true);
    }
}

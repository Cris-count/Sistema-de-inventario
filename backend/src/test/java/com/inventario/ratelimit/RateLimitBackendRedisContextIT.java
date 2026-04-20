package com.inventario.ratelimit;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Selección de backend: {@code redis} + host activa {@link ResilientRedisRateLimitBackend}.
 */
@Testcontainers(disabledWithoutDocker = true)
class RateLimitBackendRedisContextIT {

    @Container
    static final GenericContainer<?> REDIS =
            new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379);

    @BeforeAll
    static void assumeDocker() {
        assumeTrue(DockerClientFactory.instance().isDockerAvailable(), "Docker no disponible");
    }

    @Test
    void selectsResilientRedisWrapper() {
        ApplicationContextRunner runner =
                new ApplicationContextRunner()
                        .withUserConfiguration(RateLimitTestInfra.class)
                        .withPropertyValues(
                                "app.rate-limit.enabled=true",
                                "app.rate-limit.backend=redis",
                                "app.rate-limit.redis.host=localhost",
                                "app.rate-limit.redis.port=" + REDIS.getMappedPort(6379));

        runner.run(
                ctx -> {
                    assertThat(ctx).hasSingleBean(RateLimitBackend.class);
                    assertThat(ctx.getBean(RateLimitBackend.class)).isInstanceOf(ResilientRedisRateLimitBackend.class);
                    assertThat(ctx).hasSingleBean(RedisFixedWindowRateLimitBackend.class);
                    assertThat(ctx.getBean(RateLimitingHealthIndicator.class).health().getStatus().getCode())
                            .isEqualTo("UP");
                });
    }

    @Configuration
    @EnableConfigurationProperties(RateLimitProperties.class)
    @Import({
        ConfigurationPropertiesAutoConfiguration.class,
        RateLimitConfiguration.class,
        RateLimitOperationalState.class,
        RateLimitingHealthIndicator.class
    })
    static class RateLimitTestInfra {
        @Bean
        SimpleMeterRegistry meterRegistry() {
            return new SimpleMeterRegistry();
        }
    }
}

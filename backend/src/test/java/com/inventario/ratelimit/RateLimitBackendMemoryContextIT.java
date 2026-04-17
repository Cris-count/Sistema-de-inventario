package com.inventario.ratelimit;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Selección de backend: {@code memory} expone directamente {@link InMemoryFixedWindowRateLimitBackend}.
 */
class RateLimitBackendMemoryContextIT {

    private final ApplicationContextRunner runner =
            new ApplicationContextRunner()
                    .withUserConfiguration(RateLimitTestInfra.class)
                    .withPropertyValues("app.rate-limit.enabled=true", "app.rate-limit.backend=memory");

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

    @Test
    void selectsInMemoryBackendBean() {
        runner.run(
                ctx -> {
                    assertThat(ctx).hasSingleBean(RateLimitBackend.class);
                    assertThat(ctx.getBean(RateLimitBackend.class)).isInstanceOf(InMemoryFixedWindowRateLimitBackend.class);
                    assertThat(ctx.getBean(RateLimitingHealthIndicator.class).health().getStatus().getCode())
                            .isEqualTo("UP");
                });
    }
}

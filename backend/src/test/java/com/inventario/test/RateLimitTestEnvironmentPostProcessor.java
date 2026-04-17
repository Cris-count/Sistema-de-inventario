package com.inventario.test;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.Map;

/**
 * En el classpath de tests, fuerza rate-limit en memoria por encima de variables de entorno del host
 * (p. ej. {@code RATE_LIMIT_BACKEND=redis}). No se carga en el JAR de producción.
 */
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitTestEnvironmentPostProcessor implements EnvironmentPostProcessor {

    static final String PROPERTY_SOURCE_NAME = "inventarioTestRateLimitOverrides";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!isTestClasspath()) {
            return;
        }
        if (environment.getPropertySources().contains(PROPERTY_SOURCE_NAME)) {
            return;
        }
        MapPropertySource source =
                new MapPropertySource(
                        PROPERTY_SOURCE_NAME,
                        Map.of(
                                "app.rate-limit.backend",
                                "memory",
                                "app.rate-limit.redis.host",
                                ""));
        if (environment.getPropertySources().contains("systemEnvironment")) {
            environment.getPropertySources().addBefore("systemEnvironment", source);
        } else {
            environment.getPropertySources().addFirst(source);
        }
    }

    private static boolean isTestClasspath() {
        String cp = System.getProperty("java.class.path", "");
        return cp.contains("test-classes");
    }
}

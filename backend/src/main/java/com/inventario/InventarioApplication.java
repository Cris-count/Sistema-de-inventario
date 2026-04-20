package com.inventario;

import com.inventario.config.RefreshTokenProperties;
import com.inventario.ratelimit.RateLimitProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisReactiveAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.context.annotation.ImportRuntimeHints;
import com.inventario.config.SecurityHintsRegistrar;

@SpringBootApplication(
        exclude = {
            RedisAutoConfiguration.class,
            RedisReactiveAutoConfiguration.class,
            RedisRepositoriesAutoConfiguration.class
        })
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties({RateLimitProperties.class, RefreshTokenProperties.class})
@ImportRuntimeHints(SecurityHintsRegistrar.class)
public class InventarioApplication {

    public static void main(String[] args) {
        SpringApplication.run(InventarioApplication.class, args);
    }
}

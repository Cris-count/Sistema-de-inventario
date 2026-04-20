package com.inventario.ratelimit;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;

@Configuration
@Import(RateLimitConfiguration.RateLimitRedisBeans.class)
public class RateLimitConfiguration {

    @Bean
    public InMemoryFixedWindowRateLimitBackend inMemoryRateLimitBackend() {
        return new InMemoryFixedWindowRateLimitBackend();
    }

    @Bean
    @Primary
    public RateLimitBackend rateLimitBackend(
            RateLimitProperties properties,
            InMemoryFixedWindowRateLimitBackend inMemory,
            ObjectProvider<RedisFixedWindowRateLimitBackend> redisBackend,
            RateLimitOperationalState operationalState) {
        if (properties.getBackend() == RateLimitBackendType.REDIS) {
            RedisFixedWindowRateLimitBackend redis = redisBackend.getIfAvailable();
            if (redis != null) {
                operationalState.markTargetDistributedRedis();
                return new ResilientRedisRateLimitBackend(redis, inMemory, operationalState, properties);
            }
            operationalState.markMisconfiguredRedisFellBackToLocal();
        } else {
            operationalState.markLocalMemoryByConfiguration();
        }
        return inMemory;
    }

    @Configuration
    @Conditional(RedisRateLimitEnabledCondition.class)
    static class RateLimitRedisBeans {

        @Bean(destroyMethod = "destroy")
        LettuceConnectionFactory rateLimitRedisConnectionFactory(RateLimitProperties properties) {
            RateLimitProperties.Redis r = properties.getRedis();
            RedisStandaloneConfiguration standalone = new RedisStandaloneConfiguration();
            standalone.setHostName(r.getHost().trim());
            standalone.setPort(r.getPort());
            standalone.setDatabase(r.getDatabase());
            if (r.getPassword() != null && !r.getPassword().isBlank()) {
                standalone.setPassword(RedisPassword.of(r.getPassword()));
            }

            Duration timeout = r.getCommandTimeout();
            LettuceClientConfiguration clientConfig =
                    LettuceClientConfiguration.builder().commandTimeout(timeout).build();

            LettuceConnectionFactory factory = new LettuceConnectionFactory(standalone, clientConfig);
            factory.afterPropertiesSet();
            return factory;
        }

        @Bean
        StringRedisTemplate rateLimitStringRedisTemplate(LettuceConnectionFactory rateLimitRedisConnectionFactory) {
            StringRedisTemplate template = new StringRedisTemplate();
            template.setConnectionFactory(rateLimitRedisConnectionFactory);
            template.afterPropertiesSet();
            return template;
        }

        @Bean
        RedisFixedWindowRateLimitBackend redisFixedWindowRateLimitBackend(StringRedisTemplate rateLimitStringRedisTemplate) {
            return new RedisFixedWindowRateLimitBackend(rateLimitStringRedisTemplate);
        }
    }
}

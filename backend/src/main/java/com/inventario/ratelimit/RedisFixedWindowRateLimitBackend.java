package com.inventario.ratelimit;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.OptionalInt;

/**
 * Ventana fija alineada con {@link InMemoryFixedWindowRateLimitBackend}: {@code windowId = epoch / windowSeconds}.
 * INCR atómico + EXPIRE en script Lua para evitar carreras entre incremento y TTL.
 */
public class RedisFixedWindowRateLimitBackend implements RateLimitBackend {

    private static final String KEY_PREFIX = "rl:v1:";

    /**
     * Retorna {@code A} si permitido; {@code D}{@code ttl} si denegado (ttl = segundos sugeridos Retry-After).
     */
    private static final DefaultRedisScript<String> WINDOW_SCRIPT = new DefaultRedisScript<>();

    static {
        WINDOW_SCRIPT.setScriptText(
                """
                local count = redis.call('INCR', KEYS[1])
                if count == 1 then
                  redis.call('EXPIRE', KEYS[1], tonumber(ARGV[1]))
                end
                local max = tonumber(ARGV[2])
                if count > max then
                  local ttl = redis.call('TTL', KEYS[1])
                  if ttl == nil or ttl < 0 then
                    ttl = tonumber(ARGV[1])
                  end
                  return 'D' .. tostring(ttl)
                end
                return 'A'
                """);
        WINDOW_SCRIPT.setResultType(String.class);
    }

    private final StringRedisTemplate redisTemplate;

    public RedisFixedWindowRateLimitBackend(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public OptionalInt recordAndGetRetryAfterSeconds(String namespace, String bucketKey, int maxRequests, int windowSeconds) {
        if (maxRequests <= 0 || windowSeconds <= 0) {
            return OptionalInt.empty();
        }
        long now = Instant.now().getEpochSecond();
        long windowId = now / windowSeconds;
        long windowEnd = (windowId + 1) * windowSeconds;
        int ttlRemaining = (int) Math.max(1L, windowEnd - now);

        String digest = RateLimitRedisKeyHasher.bucketDigest(namespace, bucketKey);
        String redisKey = KEY_PREFIX + windowId + ":" + digest;

        List<String> keys = Collections.singletonList(redisKey);
        String raw = redisTemplate.execute(WINDOW_SCRIPT, keys, String.valueOf(ttlRemaining), String.valueOf(maxRequests));
        if (raw == null || raw.isEmpty()) {
            return OptionalInt.empty();
        }
        if (raw.charAt(0) == 'D') {
            int retry = parseRetryTail(raw);
            return OptionalInt.of(Math.max(1, retry));
        }
        return OptionalInt.empty();
    }

    private static int parseRetryTail(String raw) {
        try {
            return Integer.parseInt(raw.substring(1));
        } catch (RuntimeException ignored) {
            return 1;
        }
    }
}

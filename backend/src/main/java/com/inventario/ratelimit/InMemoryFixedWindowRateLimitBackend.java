package com.inventario.ratelimit;

import java.time.Instant;
import java.util.OptionalInt;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ventana fija por clave lógica. Un proceso por JVM; en clúster cada nodo tiene su propio conteo (para límites globales usar Redis, etc.).
 */
public class InMemoryFixedWindowRateLimitBackend implements RateLimitBackend {

    private static final class MutableCounter {
        private long windowId;
        private int count;

        private MutableCounter(long windowId, int count) {
            this.windowId = windowId;
            this.count = count;
        }
    }

    private final ConcurrentHashMap<String, MutableCounter> counters = new ConcurrentHashMap<>();

    @Override
    public OptionalInt recordAndGetRetryAfterSeconds(String namespace, String bucketKey, int maxRequests, int windowSeconds) {
        if (maxRequests <= 0 || windowSeconds <= 0) {
            return OptionalInt.empty();
        }
        long now = Instant.now().getEpochSecond();
        long windowId = now / windowSeconds;
        String fullKey = namespace + "|" + bucketKey;
        final OptionalInt[] deniedRetry = {OptionalInt.empty()};
        counters.compute(fullKey, (k, existing) -> {
            MutableCounter c =
                    existing == null || existing.windowId != windowId
                            ? new MutableCounter(windowId, 0)
                            : existing;
            if (c.count >= maxRequests) {
                long windowEnd = (windowId + 1) * windowSeconds;
                int retry = (int) Math.max(1L, windowEnd - now);
                deniedRetry[0] = OptionalInt.of(retry);
                return c;
            }
            c.count++;
            deniedRetry[0] = OptionalInt.empty();
            return c;
        });
        return deniedRetry[0];
    }
}

package com.inventario.ratelimit;

import org.junit.jupiter.api.Test;

import java.util.OptionalInt;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InMemoryFixedWindowRateLimitBackendTest {

    @Test
    void allowsUnderLimit() {
        InMemoryFixedWindowRateLimitBackend b = new InMemoryFixedWindowRateLimitBackend();
        assertTrue(b.recordAndGetRetryAfterSeconds("ns", "k", 3, 60).isEmpty());
        assertTrue(b.recordAndGetRetryAfterSeconds("ns", "k", 3, 60).isEmpty());
    }

    @Test
    void rejectsWhenAtLimit() {
        InMemoryFixedWindowRateLimitBackend b = new InMemoryFixedWindowRateLimitBackend();
        assertTrue(b.recordAndGetRetryAfterSeconds("ns", "k", 2, 60).isEmpty());
        assertTrue(b.recordAndGetRetryAfterSeconds("ns", "k", 2, 60).isEmpty());
        OptionalInt r = b.recordAndGetRetryAfterSeconds("ns", "k", 2, 60);
        assertTrue(r.isPresent());
        assertTrue(r.getAsInt() >= 1);
    }

    @Test
    void namespacesAreIndependent() {
        InMemoryFixedWindowRateLimitBackend b = new InMemoryFixedWindowRateLimitBackend();
        assertTrue(b.recordAndGetRetryAfterSeconds("a", "same", 1, 60).isEmpty());
        assertTrue(b.recordAndGetRetryAfterSeconds("b", "same", 1, 60).isEmpty());
        assertTrue(b.recordAndGetRetryAfterSeconds("a", "same", 1, 60).isPresent());
    }

    @Test
    void disabledBucket_skipsLimit() {
        InMemoryFixedWindowRateLimitBackend b = new InMemoryFixedWindowRateLimitBackend();
        for (int i = 0; i < 20; i++) {
            assertTrue(b.recordAndGetRetryAfterSeconds("x", "y", 0, 60).isEmpty());
        }
    }
}

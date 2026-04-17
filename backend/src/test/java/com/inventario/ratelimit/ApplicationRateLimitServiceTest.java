package com.inventario.ratelimit;

import com.inventario.audit.AuthAuditLogger;
import com.inventario.web.error.BusinessException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.OptionalInt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationRateLimitServiceTest {

    @Mock
    private RateLimitBackend backend;

    @Mock
    private HttpServletRequest request;

    @Mock
    private AuthAuditLogger authAuditLogger;

    private ApplicationRateLimitService service;

    @BeforeEach
    void setUp() {
        RateLimitProperties props = new RateLimitProperties();
        props.setEnabled(true);
        props.getLogin().setMaxPerIpPerWindow(10);
        props.getLogin().setMaxPerEmailPerWindow(10);
        props.getLogin().setWindowSeconds(60);
        props.getMfaVerify().setMaxPerIpPerWindow(10);
        props.getMfaVerify().setMaxPerChallengePerWindow(10);
        props.getMfaVerify().setWindowSeconds(60);
        ClientIpResolver resolver = new ClientIpResolver(props);
        service = new ApplicationRateLimitService(props, backend, resolver, authAuditLogger);
    }

    @Test
    void loginUnderLimit_noException() {
        when(backend.recordAndGetRetryAfterSeconds(anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(OptionalInt.empty());
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");
        service.assertLoginAllowed(request, "u@test.local");
    }

    @Test
    void loginRejected_throws429() {
        when(backend.recordAndGetRetryAfterSeconds(eq("login-ip"), eq("10.0.0.2"), anyInt(), anyInt()))
                .thenReturn(OptionalInt.of(42));
        when(request.getRemoteAddr()).thenReturn("10.0.0.2");
        BusinessException ex =
                assertThrows(BusinessException.class, () -> service.assertLoginAllowed(request, "u@test.local"));
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, ex.getStatus());
        assertEquals(RateLimitBlockCodes.RATE_LIMIT_EXCEEDED, ex.getBlockCode());
        assertEquals(42, ex.getRetryAfterSeconds());
    }

    @Test
    void loginAndMfaPolicies_useIndependentNamespaces() {
        when(backend.recordAndGetRetryAfterSeconds(anyString(), anyString(), anyInt(), anyInt()))
                .thenReturn(OptionalInt.empty());
        when(request.getRemoteAddr()).thenReturn("10.0.0.3");

        service.assertLoginAllowed(request, "a@b.c");
        service.assertMfaVerifyAllowed(request, "tok");

        ArgumentCaptor<String> ns = ArgumentCaptor.forClass(String.class);
        verify(backend, times(4)).recordAndGetRetryAfterSeconds(ns.capture(), anyString(), anyInt(), anyInt());
        assertThat(ns.getAllValues())
                .containsExactly("login-ip", "login-email", "mfa-ip", "mfa-challenge");
    }
}

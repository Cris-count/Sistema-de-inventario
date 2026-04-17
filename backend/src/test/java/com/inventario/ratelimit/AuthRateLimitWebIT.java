package com.inventario.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.web.dto.LoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host=",
            "app.rate-limit.enabled=true",
            "app.rate-limit.trust-x-forwarded-for=true",
            "app.rate-limit.login.max-per-ip-per-window=5",
            "app.rate-limit.login.max-per-email-per-window=100",
            "app.rate-limit.login.window-seconds=60",
            "app.rate-limit.mfa-verify.max-per-ip-per-window=5",
            "app.rate-limit.mfa-verify.max-per-challenge-per-window=100",
            "app.rate-limit.mfa-verify.window-seconds=60",
        })
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthRateLimitWebIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void login_withinLimit_not429() throws Exception {
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(
                            post("/api/v1/auth/login")
                                    .header("X-Forwarded-For", "203.0.113.10")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            objectMapper.writeValueAsString(
                                                    new LoginRequest("nobody@invalid.local", "wrong"))))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void login_exceedsIpLimit_returns429() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(
                            post("/api/v1/auth/login")
                                    .header("X-Forwarded-For", "203.0.113.11")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            objectMapper.writeValueAsString(
                                                    new LoginRequest("nobody@invalid.local", "wrong"))))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .header("X-Forwarded-For", "203.0.113.11")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                new LoginRequest("nobody@invalid.local", "wrong"))))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.blockCode").value(RateLimitBlockCodes.RATE_LIMIT_EXCEEDED));
    }

    @Test
    void mfaVerify_exceedsIpLimit_returns429() throws Exception {
        String body =
                """
                {"challengeToken":"eyJhbGciOiJIUzI1NiJ9.fake.signature","code":"123456"}
                """;
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(
                            post("/api/v1/auth/mfa/verify")
                                    .header("X-Forwarded-For", "203.0.113.12")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(
                        post("/api/v1/auth/mfa/verify")
                                .header("X-Forwarded-For", "203.0.113.12")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.blockCode").value(RateLimitBlockCodes.RATE_LIMIT_EXCEEDED));
    }

    @Test
    void mfaVerify_withinLimit_stillUnauthorized_not429() throws Exception {
        String body =
                """
                {"challengeToken":"eyJhbGciOiJIUzI1NiJ9.other.signature","code":"123456"}
                """;
        mockMvc.perform(
                        post("/api/v1/auth/mfa/verify")
                                .header("X-Forwarded-For", "203.0.113.13")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void afterLoginIpExhausted_mfaVerifyStillAllowedIndependentBucket() throws Exception {
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(
                            post("/api/v1/auth/login")
                                    .header("X-Forwarded-For", "203.0.113.14")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(
                                            objectMapper.writeValueAsString(
                                                    new LoginRequest("spray@invalid.local", "wrong"))))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(
                        post("/api/v1/auth/login")
                                .header("X-Forwarded-For", "203.0.113.14")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        objectMapper.writeValueAsString(
                                                new LoginRequest("spray@invalid.local", "wrong"))))
                .andExpect(status().isTooManyRequests());

        String mfaBody =
                """
                {"challengeToken":"eyJhbGciOiJIUzI1NiJ9.ind.signature","code":"123456"}
                """;
        mockMvc.perform(
                        post("/api/v1/auth/mfa/verify")
                                .header("X-Forwarded-For", "203.0.113.14")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(mfaBody))
                .andExpect(status().isUnauthorized());
    }
}

package com.inventario.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host=",
            "app.rate-limit.enabled=true",
            "app.rate-limit.trust-x-forwarded-for=true",
            "app.rate-limit.auth-refresh.max-per-ip-per-window=2",
            "app.rate-limit.auth-refresh.max-per-token-fingerprint-per-window=50",
            "app.rate-limit.auth-refresh.window-seconds=60",
            "app.rate-limit.auth-logout.max-per-ip-per-window=2",
            "app.rate-limit.auth-logout.max-per-token-fingerprint-per-window=50",
            "app.rate-limit.auth-logout.window-seconds=60",
        })
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefreshTokenRateLimitIT {

    private static final String ADMIN_EMAIL = "admin@inventario.local";
    private static final String ADMIN_PASSWORD = "Admin123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void refresh_withinLimit_ok() throws Exception {
        String r = refreshFromLogin();
        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .header("X-Forwarded-For", "198.51.100.10")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_exceedsIpLimit_returns429() throws Exception {
        String r = refreshFromLogin();
        for (int i = 0; i < 2; i++) {
            MvcResult m =
                    mockMvc.perform(
                                    post("/api/v1/auth/refresh")
                                            .header("X-Forwarded-For", "198.51.100.20")
                                            .contentType(MediaType.APPLICATION_JSON)
                                            .content("{\"refreshToken\":\"" + r + "\"}"))
                            .andExpect(status().isOk())
                            .andReturn();
            r = objectMapper.readTree(m.getResponse().getContentAsString()).path("refreshToken").asText();
        }
        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .header("X-Forwarded-For", "198.51.100.20")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.blockCode").value("RATE_LIMIT_EXCEEDED"));
    }

    @Test
    void logout_exceedsIpLimit_returns429() throws Exception {
        for (int i = 0; i < 2; i++) {
            String r = refreshFromLogin();
            mockMvc.perform(
                            post("/api/v1/auth/logout")
                                    .header("X-Forwarded-For", "198.51.100.30")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content("{\"refreshToken\":\"" + r + "\"}"))
                    .andExpect(status().isNoContent());
        }
        String r3 = refreshFromLogin();
        mockMvc.perform(
                        post("/api/v1/auth/logout")
                                .header("X-Forwarded-For", "198.51.100.30")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r3 + "\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.blockCode").value("RATE_LIMIT_EXCEEDED"));
    }

    private String refreshFromLogin() throws Exception {
        MvcResult login =
                mockMvc.perform(
                                post("/api/v1/auth/login")
                                        .header("X-Forwarded-For", "198.51.100.99")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}"))
                        .andExpect(status().isOk())
                        .andReturn();
        JsonNode b = objectMapper.readTree(login.getResponse().getContentAsString());
        return b.path("refreshToken").asText();
    }
}

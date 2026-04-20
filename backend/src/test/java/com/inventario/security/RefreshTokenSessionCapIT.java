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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
            "app.refresh-token.max-active-families-per-user=1",
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefreshTokenSessionCapIT {

    private static final String ADMIN_EMAIL = "admin@inventario.local";
    private static final String ADMIN_PASSWORD = "Admin123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void secondLogin_revokesPreviousFamily_refreshWithOldTokenFails() throws Exception {
        String r1 = loginRefresh();
        String r2 = loginRefresh();
        assertThat(r1).isNotBlank().isNotEqualTo(r2);
        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r1 + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.blockCode").value("REFRESH_TOKEN_REVOKED"));
        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r2 + "\"}"))
                .andExpect(status().isOk());
    }

    private String loginRefresh() throws Exception {
        MvcResult login =
                mockMvc.perform(
                                post("/api/v1/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}"))
                        .andExpect(status().isOk())
                        .andReturn();
        JsonNode b = objectMapper.readTree(login.getResponse().getContentAsString());
        return b.path("refreshToken").asText();
    }
}

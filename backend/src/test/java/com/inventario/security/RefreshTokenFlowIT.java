package com.inventario.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.service.security.AuthTokenPairIssuer;
import com.inventario.web.dto.TokenResponse;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RefreshTokenFlowIT {

    private static final String ADMIN_EMAIL = "admin@inventario.local";
    private static final String ADMIN_PASSWORD = "Admin123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuthTokenPairIssuer authTokenPairIssuer;

    @Test
    void login_emitsAccessAndRefresh() throws Exception {
        JsonNode body = loginJson();
        assertThat(body.path("accessToken").asText()).isNotBlank();
        assertThat(body.path("refreshToken").asText()).isNotBlank();
        assertThat(body.path("refreshExpiresIn").asLong()).isPositive();
    }

    @Test
    void authTokenPairIssuer_samePathAsMfaSuccess_emitsRefresh() {
        Usuario u = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        HttpServletRequest req = new MockHttpServletRequest();
        TokenResponse pair = authTokenPairIssuer.issueForUser(u, req);
        assertThat(pair.refreshToken()).isNotBlank();
        assertThat(pair.refreshExpiresIn()).isNotNull().isPositive();
    }

    @Test
    void refresh_rotatesAndNewPairWorks() throws Exception {
        JsonNode login = loginJson();
        String r1 = login.path("refreshToken").asText();
        MvcResult refreshed =
                mockMvc.perform(
                                post("/api/v1/auth/refresh")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"refreshToken\":\"" + r1 + "\"}"))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.refreshToken").exists())
                        .andReturn();
        JsonNode rBody = objectMapper.readTree(refreshed.getResponse().getContentAsString());
        String r2 = rBody.path("refreshToken").asText();
        assertThat(r2).isNotBlank().isNotEqualTo(r1);

        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r2 + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void refresh_reuseOfOldToken_revokesFamily() throws Exception {
        JsonNode login = loginJson();
        String r1 = login.path("refreshToken").asText();
        MvcResult firstRefresh =
                mockMvc.perform(
                                post("/api/v1/auth/refresh")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content("{\"refreshToken\":\"" + r1 + "\"}"))
                        .andExpect(status().isOk())
                        .andReturn();
        String r2 = objectMapper.readTree(firstRefresh.getResponse().getContentAsString()).path("refreshToken").asText();

        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r1 + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.blockCode").value("REFRESH_TOKEN_REUSED"));

        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r2 + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refresh_afterLogout_fails() throws Exception {
        JsonNode login = loginJson();
        String r = login.path("refreshToken").asText();
        mockMvc.perform(
                        post("/api/v1/auth/logout")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r + "\"}"))
                .andExpect(status().isNoContent());

        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + r + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.blockCode").value("REFRESH_TOKEN_REVOKED"));
    }

    @Test
    void accessTokenFromRefresh_keepsEmpresaClaim() throws Exception {
        JsonNode login = loginJson();
        String access = login.path("accessToken").asText();
        Claims c = jwtService.parse(access);
        jwtService.assertIssuerAndAudience(c);
        assertThat(c.get("empresaId")).isNotNull();
        assertThat(c.get("token_use", String.class)).isEqualTo("ACCESS");
    }

    @Test
    void refreshToken_notAcceptedAsBearerForProtectedApi() throws Exception {
        JsonNode login = loginJson();
        String refresh = login.path("refreshToken").asText();
        mockMvc.perform(
                        get("/api/v1/auth/me").header("Authorization", "Bearer " + refresh))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode loginJson() throws Exception {
        MvcResult r =
                mockMvc.perform(
                                post("/api/v1/auth/login")
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(
                                                "{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}"))
                        .andExpect(status().isOk())
                        .andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString());
    }
}

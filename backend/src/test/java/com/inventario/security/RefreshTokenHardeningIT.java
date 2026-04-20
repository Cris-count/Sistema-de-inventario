package com.inventario.security;

import com.inventario.domain.entity.RefreshToken;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RefreshTokenRepository;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.service.security.RefreshTokenHasher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

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
class RefreshTokenHardeningIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private RefreshTokenHasher refreshTokenHasher;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void refresh_whenFamilyAbsoluteExpired_returnsBlockCode() throws Exception {
        Usuario u = usuarioRepository.findByEmailIgnoreCase("admin@inventario.local").orElseThrow();
        String plain = "test-opaque-" + UUID.randomUUID();
        Instant now = Instant.now();
        Instant familyDead = now.minusSeconds(300);
        Instant tokenAlive = now.plusSeconds(3600);
        RefreshToken row =
                RefreshToken.builder()
                        .usuario(u)
                        .tokenHash(refreshTokenHasher.hashOpaqueToken(plain))
                        .familyId(UUID.randomUUID().toString())
                        .issuedAt(now.minusSeconds(600))
                        .expiresAt(tokenAlive)
                        .familyExpiresAt(familyDead)
                        .build();
        refreshTokenRepository.save(row);

        mockMvc.perform(
                        post("/api/v1/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"refreshToken\":\"" + plain + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.blockCode").value("REFRESH_FAMILY_EXPIRED"));
    }
}

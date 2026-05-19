package com.inventario.service.ai;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.service.CurrentUserService;
import com.inventario.service.ai.recommendation.AiRecommendationPersistenceService;
import com.inventario.service.ai.recommendation.AiTenantScope;
import com.inventario.service.ai.recommendation.AiTenantScopeService;
import com.inventario.web.dto.ai.AIChatRequestDto;
import com.inventario.web.dto.ai.AIContextDto;
import com.inventario.web.dto.ai.AiPythonChatResponsePayload;
import com.inventario.web.dto.ai.AiPythonRecommendationPayload;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIApplicationServiceChatPersistenceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private AIClient aiClient;

    @Mock
    private AIContextBuilder aiContextBuilder;

    @Mock
    private AiRecommendationPersistenceService aiRecommendationPersistenceService;

    @Mock
    private AiTenantScopeService aiTenantScopeService;

    @InjectMocks
    private AIApplicationService aiApplicationService;

    @Test
    void chat_callsPersistenceAfterSuccessfulPythonResponse() {
        Empresa empresa = Empresa.builder().id(77L).build();
        Rol rol = new Rol();
        rol.setCodigo(SecurityRoles.ADMIN);
        Usuario usuario =
                Usuario.builder()
                        .id(3L)
                        .email("u@test.local")
                        .nombre("n")
                        .passwordHash("x")
                        .empresa(empresa)
                        .rol(rol)
                        .activo(true)
                        .mfaEnabled(false)
                        .createdAt(java.time.Instant.now())
                        .build();

        when(currentUserService.requireUsuario()).thenReturn(usuario);
        when(aiContextBuilder.buildSanitizedContext(eq(77L), eq(SecurityRoles.ADMIN)))
                .thenReturn(AIContextDto.empty());

        var reco =
                new AiPythonRecommendationPayload("RESTOCK", "t", "d", "high", 0.5, Map.of("product_id", 1));
        var py =
                new AiPythonChatResponsePayload(
                        "Assistant reply.", "purchase_suggestion", 0.82, true, List.of(reco));
        when(aiClient.chat(any())).thenReturn(Mono.just(py));

        AiTenantScope scope = new AiTenantScope(77L);
        when(aiTenantScopeService.resolveForUsuario(usuario)).thenReturn(scope);

        var response = aiApplicationService.chat(new AIChatRequestDto("buy rice"));

        assertEquals("Assistant reply.", response.answer());
        verify(aiRecommendationPersistenceService).persistRecommendationsSafely(eq(py), eq(usuario), eq(scope));
    }
}

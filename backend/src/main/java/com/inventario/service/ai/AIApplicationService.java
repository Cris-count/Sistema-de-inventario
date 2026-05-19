package com.inventario.service.ai;

import com.inventario.config.SecurityRoles;
import com.inventario.service.CurrentUserService;
import com.inventario.service.ai.recommendation.AiRecommendationPersistenceService;
import com.inventario.service.ai.recommendation.AiTenantScope;
import com.inventario.service.ai.recommendation.AiTenantScopeService;
import com.inventario.web.dto.ai.AIChatRequestDto;
import com.inventario.web.dto.ai.AIChatResponseDto;
import com.inventario.web.dto.ai.AIContextDto;
import com.inventario.web.dto.ai.AIRecommendationDto;
import com.inventario.web.dto.ai.AIServiceChatRequestDto;
import com.inventario.web.dto.ai.AiPythonChatResponsePayload;
import com.inventario.web.dto.ai.AiPythonRecommendationPayload;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Orquestación del asistente: valida tenant + rol, delega construcción de contexto y llama a {@link AIClient}.
 *
 * <p>Futuro: políticas SaaS ({@code PlanEntitlementService}) y cotas por empresa aquí ou en builder.</p>
 */
@Service
@RequiredArgsConstructor
public class AIApplicationService {

    private static final Set<String> ASSISTANT_ROLES = Set.of(
            SecurityRoles.SUPER_ADMIN,
            SecurityRoles.ADMIN,
            SecurityRoles.GERENCIA,
            SecurityRoles.COMPRAS,
            SecurityRoles.AUX_BODEGA);

    private final CurrentUserService currentUserService;
    private final AIClient aiClient;
    private final AIContextBuilder aiContextBuilder;
    private final AiRecommendationPersistenceService aiRecommendationPersistenceService;
    private final AiTenantScopeService aiTenantScopeService;

    @Transactional(readOnly = true)
    public AIChatResponseDto chat(AIChatRequestDto request) {
        var usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();

        String rolCodigo = SecurityRoles.canonicalCodigo(usuario.getRol().getCodigo());
        if (!ASSISTANT_ROLES.contains(rolCodigo)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Tu rol no tiene acceso al asistente de inventario.");
        }

        AIContextDto context = aiContextBuilder.buildSanitizedContext(empresaId, rolCodigo);

        AIServiceChatRequestDto outbound =
                new AIServiceChatRequestDto(
                        empresaId,
                        usuario.getId(),
                        rolCodigo,
                        request.question().trim(),
                        context);

        AiPythonChatResponsePayload py =
                aiClient.chat(outbound).blockOptional().orElse(null);
        if (py == null || py.answer() == null || py.answer().isBlank()) {
            return AIChatResponseDto.unavailable();
        }
        AiTenantScope tenantScope = aiTenantScopeService.resolveForUsuario(usuario);
        aiRecommendationPersistenceService.persistRecommendationsSafely(py, usuario, tenantScope);
        return mapPythonResponse(py);
    }

    private AIChatResponseDto mapPythonResponse(AiPythonChatResponsePayload py) {
        if (py.answer() == null || py.answer().isBlank()) {
            return AIChatResponseDto.unavailable();
        }
        List<AIRecommendationDto> recs = new ArrayList<>();
        for (AiPythonRecommendationPayload r : py.recommendations()) {
            if (r == null) {
                continue;
            }
            String code = r.code() != null && !r.code().isBlank() ? r.code() : "RECOMMENDATION";
            String title = r.title() != null ? r.title() : "";
            String detail = r.detail() != null ? r.detail() : "";
            Map<String, Object> meta = new LinkedHashMap<>();
            if (r.metadata() != null && !r.metadata().isEmpty()) {
                meta.putAll(r.metadata());
            }
            meta.put("priority", r.priority() != null ? r.priority() : "");
            Double recConf = r.confidence() != null ? r.confidence() : 0.0;
            recs.add(new AIRecommendationDto(code, title, detail, recConf, meta));
        }

        Double conf = py.confidence() != null ? py.confidence() : 0.0;
        String intent =
                py.intent() != null && !py.intent().isBlank() ? py.intent() : "inventory_assistant";
        return new AIChatResponseDto(
                py.answer(), intent, conf, Boolean.TRUE.equals(py.usedContext()), recs);
    }
}

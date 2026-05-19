package com.inventario.service.ai.recommendation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.AiRecommendationRepository;
import com.inventario.web.dto.ai.AiPythonChatResponsePayload;
import com.inventario.web.dto.ai.AiPythonRecommendationPayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Objects;

/**
 * Persiste recomendaciones devueltas por el microservicio Python justo después del chat,
 * sin afectar la respuesta HTTP ni ejecutar acciones de negocio automáticas.
 */
@Service
@Slf4j
public class AiRecommendationPersistenceService {

    private static final Duration DEDUPE_WINDOW = Duration.ofHours(24);

    private final AiRecommendationRepository repository;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate requiresNewTx;

    public AiRecommendationPersistenceService(
            AiRecommendationRepository repository,
            ObjectMapper objectMapper,
            PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.requiresNewTx = new TransactionTemplate(transactionManager);
        this.requiresNewTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Persiste filas {@code PENDING} a partir del payload Python. Fallos internos se registran y no se propagan.
     */
    public void persistRecommendationsSafely(
            AiPythonChatResponsePayload aiResponse,
            Usuario currentUser,
            AiTenantScope tenantScope) {
        try {
            requiresNewTx.executeWithoutResult(
                    status -> persistRecommendationsInternal(aiResponse, currentUser, tenantScope));
        } catch (Exception ex) {
            log.warn(
                    "AI recommendation persistence skipped after chat (empresaId={}): {}",
                    tenantScope.empresaId(),
                    ex.toString());
        }
    }

    void persistRecommendationsInternal(
            AiPythonChatResponsePayload aiResponse,
            Usuario currentUser,
            AiTenantScope tenantScope) {
        if (aiResponse == null || aiResponse.recommendations() == null || aiResponse.recommendations().isEmpty()) {
            return;
        }

        Empresa empresaRef = currentUser.getEmpresa();
        if (empresaRef == null || !Objects.equals(empresaRef.getId(), tenantScope.empresaId())) {
            log.warn(
                    "Tenant mismatch usuario vs scope al persistir IA (usuario empresa={}, scope={})",
                    empresaRef != null ? empresaRef.getId() : null,
                    tenantScope.empresaId());
            return;
        }

        Instant windowStart = Instant.now().minus(DEDUPE_WINDOW);
        String chatIntent =
                aiResponse.intent() != null && !aiResponse.intent().isBlank()
                        ? aiResponse.intent().trim()
                        : null;
        Double chatConfidence = aiResponse.confidence();
        Boolean usedContext = aiResponse.usedContext();

        for (AiPythonRecommendationPayload r : aiResponse.recommendations()) {
            if (r == null || !isMeaningfulRecommendation(r)) {
                continue;
            }
            String dedupe = buildDedupeKey(tenantScope.empresaId(), r);
            if (repository.existsByEmpresa_IdAndDedupeKeyAndCreatedAtAfter(
                    tenantScope.empresaId(), dedupe, windowStart)) {
                continue;
            }

            String code =
                    r.code() != null && !r.code().isBlank()
                            ? r.code().trim()
                            : "RECOMMENDATION";
            String title = r.title() != null ? r.title().trim() : "";
            String detail = r.detail() != null ? r.detail().trim() : "";
            String priority = resolvePriority(r);

            AiRecommendation entity =
                    AiRecommendation.builder()
                            .empresa(empresaRef)
                            .status(AiRecommendationStatus.PENDING)
                            .recommendationCode(code)
                            .title(title)
                            .detail(detail.isEmpty() ? null : detail)
                            .confidence(r.confidence())
                            .priority(priority != null && !priority.isBlank() ? priority.trim() : null)
                            .chatIntent(chatIntent)
                            .chatConfidence(chatConfidence)
                            .usedContext(usedContext)
                            .dedupeKey(dedupe)
                            .metadataJson(serializeMetadata(r))
                            .build();

            repository.save(entity);
        }
    }

    private static boolean isMeaningfulRecommendation(AiPythonRecommendationPayload r) {
        boolean codeOk = r.code() != null && !r.code().isBlank();
        boolean titleOk = r.title() != null && !r.title().isBlank();
        boolean detailOk = r.detail() != null && !r.detail().isBlank();
        return codeOk || titleOk || detailOk;
    }

    private static String resolvePriority(AiPythonRecommendationPayload r) {
        if (r.priority() != null && !r.priority().isBlank()) {
            return r.priority().trim();
        }
        if (r.metadata() == null || r.metadata().isEmpty()) {
            return null;
        }
        Object p = r.metadata().get("priority");
        return p != null ? String.valueOf(p).trim() : null;
    }

    private String serializeMetadata(AiPythonRecommendationPayload r) {
        if (r.metadata() == null || r.metadata().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(r.metadata());
        } catch (JsonProcessingException e) {
            log.debug("Could not serialize recommendation metadata to JSON: {}", e.toString());
            return null;
        }
    }

    /**
     * Huella estable por empresa + contenido principal + metadata parcial (p. ej. product_id).
     */
    public static String buildDedupeKey(long empresaId, AiPythonRecommendationPayload r) {
        String code = normalizeEmpty(r.code());
        String title = normalizeEmpty(r.title());
        String detail = normalizeEmpty(r.detail());
        String productHint = "";
        if (r.metadata() != null) {
            Object pid = firstNonNull(r.metadata().get("product_id"), r.metadata().get("productId"));
            if (pid != null) {
                productHint = "|pid:" + pid;
            }
        }
        String payload =
                empresaId
                        + "|"
                        + code
                        + "|"
                        + title
                        + "|"
                        + detail
                        + productHint;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static Object firstNonNull(Object a, Object b) {
        return a != null ? a : b;
    }

    private static String normalizeEmpty(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }
}

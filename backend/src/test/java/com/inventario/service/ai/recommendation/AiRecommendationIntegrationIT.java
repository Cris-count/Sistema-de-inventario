package com.inventario.service.ai.recommendation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.AiPurchaseSuggestionRepository;
import com.inventario.domain.repository.AiRecommendationRepository;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.web.dto.ai.AiPythonChatResponsePayload;
import com.inventario.web.dto.ai.AiPythonRecommendationPayload;
import com.inventario.web.error.BusinessException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@ActiveProfiles("test")
class AiRecommendationIntegrationIT {

    private static final String ADMIN_EMAIL = "admin@inventario.local";

    @Autowired
    private AiRecommendationRepository recommendationRepository;

    @Autowired
    private AiRecommendationPersistenceService persistenceService;

    @Autowired
    private AiRecommendationLifecycleService lifecycleService;

    @Autowired
    private AiPurchaseSuggestionService purchaseSuggestionService;

    @Autowired
    private AiPurchaseSuggestionReviewService purchaseSuggestionReviewService;

    @Autowired
    private AiPurchaseSuggestionRepository purchaseSuggestionRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void cleanRecommendations() {
        purchaseSuggestionRepository.deleteAll();
        recommendationRepository.deleteAll();
    }

    @AfterEach
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsAdmin() {
        SecurityContextHolder.getContext()
                .setAuthentication(
                        new UsernamePasswordAuthenticationToken(
                                ADMIN_EMAIL,
                                null,
                                List.of(new SimpleGrantedAuthority("ADMIN"))));
    }

    @Test
    void persistsPendingRecommendationAfterPythonPayload() {
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var scope = new AiTenantScope(usuario.getEmpresa().getId());
        var py =
                new AiPythonChatResponsePayload(
                        "ok",
                        "purchase_suggestion",
                        0.8,
                        true,
                        List.of(
                                new AiPythonRecommendationPayload(
                                        "RESTOCK_42",
                                        "Reorder preview",
                                        "Confirm with purchasing workflow.",
                                        "high",
                                        0.55,
                                        Map.of("product_id", 42))));

        persistenceService.persistRecommendationsSafely(py, usuario, scope);

        assertEquals(1, recommendationRepository.count());
        var saved = recommendationRepository.findAll().get(0);
        assertEquals(AiRecommendationStatus.PENDING, saved.getStatus());
        assertEquals("RESTOCK_42", saved.getRecommendationCode());
        assertEquals("purchase_suggestion", saved.getChatIntent());
    }

    @Test
    void duplicateWithin24HoursIsIgnored() {
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var scope = new AiTenantScope(usuario.getEmpresa().getId());
        var payload =
                new AiPythonRecommendationPayload(
                        "RESTOCK_DUP", "Same", "Same detail body.", null, 0.4, Map.of());

        var py =
                new AiPythonChatResponsePayload(
                        "ok", "inventory_assistant", 0.5, false, List.of(payload));

        persistenceService.persistRecommendationsSafely(py, usuario, scope);
        persistenceService.persistRecommendationsSafely(py, usuario, scope);

        assertEquals(1, recommendationRepository.count());
    }

    @Test
    void persistenceFailureDoesNotPropagateFromSafelyMethod() {
        var repo = Mockito.mock(AiRecommendationRepository.class);
        Mockito.when(
                        repo.existsByEmpresa_IdAndDedupeKeyAndCreatedAtAfter(
                                Mockito.anyLong(),
                                Mockito.anyString(),
                                Mockito.any()))
                .thenThrow(new RuntimeException("simulated DB failure"));

        var buggy =
                new AiRecommendationPersistenceService(repo, objectMapper, transactionManager);

        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var scope = new AiTenantScope(usuario.getEmpresa().getId());
        var py =
                new AiPythonChatResponsePayload(
                        "ok",
                        "inventory_assistant",
                        0.5,
                        false,
                        List.of(new AiPythonRecommendationPayload("X", "t", "d", null, null, Map.of())));

        assertDoesNotThrow(() -> buggy.persistRecommendationsSafely(py, usuario, scope));
    }

    @Test
    void recommendationsScopedByEmpresaAtRepositoryLevel() {
        Empresa other =
                empresaRepository.save(
                        Empresa.builder()
                                .nombre("Otra empresa IA")
                                .identificacion("AI-TEN-B-" + System.nanoTime())
                                .estado(EstadoEmpresa.ACTIVA)
                                .createdAt(Instant.now())
                                .build());

        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        Long tenantA = usuario.getEmpresa().getId();

        var row =
                com.inventario.domain.entity.AiRecommendation.builder()
                        .empresa(usuario.getEmpresa())
                        .status(AiRecommendationStatus.PENDING)
                        .recommendationCode("ISO_TEST")
                        .title("t")
                        .detail("d")
                        .dedupeKey("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef")
                        .build();
        recommendationRepository.save(row);

        assertTrue(recommendationRepository.findByEmpresa_IdOrderByCreatedAtDesc(other.getId()).isEmpty());
        assertEquals(
                1,
                recommendationRepository.findByEmpresa_IdOrderByCreatedAtDesc(tenantA).size());
    }

    @Test
    void pendingToAcceptedToExecuted() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var scope = new AiTenantScope(usuario.getEmpresa().getId());
        var py =
                new AiPythonChatResponsePayload(
                        "ok",
                        "stock_risk",
                        0.7,
                        true,
                        List.of(
                                new AiPythonRecommendationPayload(
                                        "RISK_HIGH", "Critical SKU", "Review runway.", "high", 0.9, Map.of())));
        persistenceService.persistRecommendationsSafely(py, usuario, scope);
        Long id = recommendationRepository.findAll().get(0).getId();

        var accepted = lifecycleService.accept(id);
        assertEquals(AiRecommendationStatus.ACCEPTED, accepted.getStatus());

        var executed = lifecycleService.execute(id);
        assertEquals(AiRecommendationStatus.EXECUTED, executed.getStatus());
    }

    @Test
    void executedRecommendationCannotReturnToPendingViaAccept() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var scope = new AiTenantScope(usuario.getEmpresa().getId());
        var py =
                new AiPythonChatResponsePayload(
                        "ok",
                        "inventory_assistant",
                        0.5,
                        false,
                        List.of(
                                new AiPythonRecommendationPayload(
                                        "DONE_FLOW", "x", "y", null, null, Map.of())));
        persistenceService.persistRecommendationsSafely(py, usuario, scope);
        Long id = recommendationRepository.findAll().get(0).getId();
        lifecycleService.accept(id);
        lifecycleService.execute(id);

        BusinessException ex = assertThrows(BusinessException.class, () -> lifecycleService.accept(id));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void createsDraftPurchaseSuggestionFromAcceptedRestockRecommendation() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        AiRecommendation recommendation = saveRecommendation(
                usuario.getEmpresa(),
                AiRecommendationStatus.ACCEPTED,
                "RESTOCK_SKU_42",
                """
                {
                  "product_id": 42,
                  "product_name": "Guantes nitrilo",
                  "warehouse_name": "Principal",
                  "current_stock": 3,
                  "minimum_stock": 10,
                  "quantity_sold_last30_days": 28,
                  "priority": "high"
                }
                """);

        var draft = purchaseSuggestionService.createDraftFromRecommendation(recommendation.getId());

        assertEquals(AiPurchaseSuggestionStatus.DRAFT, draft.getStatus());
        assertEquals(usuario.getEmpresa().getId(), draft.getEmpresa().getId());
        assertEquals(recommendation.getId(), draft.getSourceRecommendation().getId());
        assertEquals(42L, draft.getProductId());
        assertEquals("Guantes nitrilo", draft.getProductName());
        assertEquals("Principal", draft.getWarehouseName());
        assertEquals(0, new java.math.BigDecimal("17.0000").compareTo(draft.getSuggestedQuantity()));
        assertEquals("high", draft.getPriority());
    }

    @Test
    void rejectsPendingRecommendationForPurchaseSuggestion() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        AiRecommendation recommendation =
                saveRecommendation(usuario.getEmpresa(), AiRecommendationStatus.PENDING, "RESTOCK_SKU_42", "{}");

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionService.createDraftFromRecommendation(recommendation.getId()));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("Only accepted RESTOCK recommendations can generate purchase suggestions.", ex.getMessage());
    }

    @Test
    void rejectsNonRestockRecommendationForPurchaseSuggestion() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        AiRecommendation recommendation =
                saveRecommendation(usuario.getEmpresa(), AiRecommendationStatus.ACCEPTED, "SALES_FOCUS", "{}");

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionService.createDraftFromRecommendation(recommendation.getId()));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    @Test
    void preventsDuplicatePurchaseSuggestionForSameRecommendation() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        AiRecommendation recommendation = saveRecommendation(
                usuario.getEmpresa(),
                AiRecommendationStatus.ACCEPTED,
                "RESTOCK_SKU_42",
                "{\"current_stock\": 1, \"minimum_stock\": 4}");

        purchaseSuggestionService.createDraftFromRecommendation(recommendation.getId());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionService.createDraftFromRecommendation(recommendation.getId()));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals(1, purchaseSuggestionRepository.count());
    }

    @Test
    void purchaseSuggestionCreationIsScopedToAuthenticatedEmpresa() {
        authenticateAsAdmin();
        var otherEmpresa = empresaRepository.save(Empresa.builder()
                .nombre("Otra empresa draft")
                .identificacion("AI-DRAFT-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        var rol = rolRepository.findByCodigo("ADMIN").orElseThrow();
        Usuario otherUser = usuarioRepository.save(Usuario.builder()
                .empresa(otherEmpresa)
                .email("other-ai-draft-" + System.nanoTime() + "@inventario.local")
                .passwordHash("x")
                .nombre("Other")
                .rol(rol)
                .activo(true)
                .createdAt(Instant.now())
                .build());
        AiRecommendation otherRecommendation =
                saveRecommendation(otherUser.getEmpresa(), AiRecommendationStatus.ACCEPTED, "RESTOCK_SKU_99", "{}");

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionService.createDraftFromRecommendation(otherRecommendation.getId()));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals(0, purchaseSuggestionRepository.count());
    }

    @Test
    void listsOnlyCurrentEmpresaPurchaseSuggestions() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var currentSuggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);

        var otherEmpresa = empresaRepository.save(Empresa.builder()
                .nombre("Otra empresa lista")
                .identificacion("AI-LIST-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        var rol = rolRepository.findByCodigo("ADMIN").orElseThrow();
        Usuario otherUser = usuarioRepository.save(Usuario.builder()
                .empresa(otherEmpresa)
                .email("other-ai-list-" + System.nanoTime() + "@inventario.local")
                .passwordHash("x")
                .nombre("Other")
                .rol(rol)
                .activo(true)
                .createdAt(Instant.now())
                .build());
        savePurchaseSuggestion(otherUser, AiPurchaseSuggestionStatus.DRAFT);

        var list = purchaseSuggestionReviewService.list(AiPurchaseSuggestionStatus.DRAFT);

        assertEquals(1, list.size());
        assertEquals(currentSuggestion.getId(), list.get(0).getId());
        assertEquals(usuario.getEmpresa().getId(), list.get(0).getEmpresa().getId());
    }

    @Test
    void updatesSuggestedQuantityAndNotesInDraft() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var suggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);

        var updated = purchaseSuggestionReviewService.updateDraft(
                suggestion.getId(),
                new com.inventario.web.dto.ai.AiPurchaseSuggestionUpdateRequestDto(
                        new BigDecimal("12"), "Revisar con compras", "Bodega norte"));

        assertEquals(0, new BigDecimal("12.0000").compareTo(updated.getSuggestedQuantity()));
        assertEquals("Revisar con compras", updated.getNotes());
        assertEquals("Bodega norte", updated.getWarehouseName());
        assertEquals(AiPurchaseSuggestionStatus.DRAFT, updated.getStatus());
    }

    @Test
    void rejectsInvalidSuggestedQuantity() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var suggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);

        BusinessException zero = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionReviewService.updateDraft(
                        suggestion.getId(),
                        new com.inventario.web.dto.ai.AiPurchaseSuggestionUpdateRequestDto(
                                BigDecimal.ZERO, null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, zero.getStatus());

        BusinessException decimal = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionReviewService.updateDraft(
                        suggestion.getId(),
                        new com.inventario.web.dto.ai.AiPurchaseSuggestionUpdateRequestDto(
                                new BigDecimal("1.5"), null, null)));
        assertEquals(HttpStatus.BAD_REQUEST, decimal.getStatus());
    }

    @Test
    void approvesDraftPurchaseSuggestion() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var suggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);

        var approved = purchaseSuggestionReviewService.approve(suggestion.getId());

        assertEquals(AiPurchaseSuggestionStatus.APPROVED, approved.getStatus());
        assertTrue(approved.getApprovedAt() != null);
        assertEquals(null, approved.getDismissedAt());
    }

    @Test
    void dismissesDraftPurchaseSuggestion() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var suggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);

        var dismissed = purchaseSuggestionReviewService.dismiss(suggestion.getId());

        assertEquals(AiPurchaseSuggestionStatus.DISMISSED, dismissed.getStatus());
        assertTrue(dismissed.getDismissedAt() != null);
        assertEquals(null, dismissed.getApprovedAt());
    }

    @Test
    void rejectsApprovedToDismissedTransition() {
        authenticateAsAdmin();
        var usuario = usuarioRepository.findByEmailIgnoreCase(ADMIN_EMAIL).orElseThrow();
        var suggestion = savePurchaseSuggestion(usuario, AiPurchaseSuggestionStatus.DRAFT);
        purchaseSuggestionReviewService.approve(suggestion.getId());

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionReviewService.dismiss(suggestion.getId()));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
    }

    @Test
    void rejectsCrossTenantPurchaseSuggestionAccess() {
        authenticateAsAdmin();
        var otherEmpresa = empresaRepository.save(Empresa.builder()
                .nombre("Otra empresa access")
                .identificacion("AI-ACCESS-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        var rol = rolRepository.findByCodigo("ADMIN").orElseThrow();
        Usuario otherUser = usuarioRepository.save(Usuario.builder()
                .empresa(otherEmpresa)
                .email("other-ai-access-" + System.nanoTime() + "@inventario.local")
                .passwordHash("x")
                .nombre("Other")
                .rol(rol)
                .activo(true)
                .createdAt(Instant.now())
                .build());
        var otherSuggestion = savePurchaseSuggestion(otherUser, AiPurchaseSuggestionStatus.DRAFT);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> purchaseSuggestionReviewService.find(otherSuggestion.getId()));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    private AiRecommendation saveRecommendation(
            Empresa empresa, AiRecommendationStatus status, String code, String metadataJson) {
        return recommendationRepository.save(AiRecommendation.builder()
                .empresa(empresa)
                .status(status)
                .recommendationCode(code)
                .title("Draft test")
                .detail("Draft detail")
                .priority("medium")
                .dedupeKey("dedupe-" + System.nanoTime())
                .metadataJson(metadataJson)
                .build());
    }

    private com.inventario.domain.entity.AiPurchaseSuggestion savePurchaseSuggestion(
            Usuario user, AiPurchaseSuggestionStatus status) {
        AiRecommendation recommendation = saveRecommendation(
                user.getEmpresa(),
                AiRecommendationStatus.ACCEPTED,
                "RESTOCK_TEST_" + System.nanoTime(),
                "{}");
        return purchaseSuggestionRepository.save(com.inventario.domain.entity.AiPurchaseSuggestion.builder()
                .empresa(user.getEmpresa())
                .sourceRecommendation(recommendation)
                .productId(100L)
                .productName("Producto prueba")
                .warehouseName("Principal")
                .currentStock(new BigDecimal("2"))
                .minimumStock(new BigDecimal("5"))
                .quantitySoldLast30Days(new BigDecimal("8"))
                .suggestedQuantity(new BigDecimal("8.0000"))
                .priority("medium")
                .status(status)
                .createdBy(user)
                .build());
    }
}

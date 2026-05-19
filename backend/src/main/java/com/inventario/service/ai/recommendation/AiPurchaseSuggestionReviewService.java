package com.inventario.service.ai.recommendation;

import com.inventario.domain.entity.AiPurchaseSuggestion;
import com.inventario.domain.entity.AiPurchaseSuggestionStatus;
import com.inventario.domain.repository.AiPurchaseSuggestionRepository;
import com.inventario.web.dto.ai.AiPurchaseSuggestionUpdateRequestDto;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiPurchaseSuggestionReviewService {

    private final AiPurchaseSuggestionRepository repository;
    private final AiTenantScopeService tenantScopeService;

    @Transactional(readOnly = true)
    public List<AiPurchaseSuggestion> list(AiPurchaseSuggestionStatus status) {
        Long empresaId = currentEmpresaId();
        if (status != null) {
            return repository.findByEmpresa_IdAndStatusOrderByCreatedAtDesc(empresaId, status);
        }
        return repository.findByEmpresa_IdOrderByCreatedAtDesc(empresaId);
    }

    @Transactional(readOnly = true)
    public AiPurchaseSuggestion find(Long id) {
        return findForCurrentEmpresa(id);
    }

    @Transactional
    public AiPurchaseSuggestion updateDraft(Long id, AiPurchaseSuggestionUpdateRequestDto request) {
        AiPurchaseSuggestion suggestion = findForCurrentEmpresa(id);
        requireDraft(suggestion, "Solo las sugerencias en borrador se pueden editar.");

        BigDecimal quantity = validateQuantity(request.suggestedQuantity());
        suggestion.setSuggestedQuantity(quantity);
        suggestion.setNotes(normalizeText(request.notes(), 2000));
        suggestion.setWarehouseName(normalizeText(request.warehouseName(), 255));
        return repository.save(suggestion);
    }

    @Transactional
    public AiPurchaseSuggestion approve(Long id) {
        AiPurchaseSuggestion suggestion = findForCurrentEmpresa(id);
        requireDraft(suggestion, "Solo las sugerencias en borrador se pueden aprobar.");
        suggestion.setStatus(AiPurchaseSuggestionStatus.APPROVED);
        suggestion.setApprovedAt(Instant.now());
        suggestion.setDismissedAt(null);
        return repository.save(suggestion);
    }

    @Transactional
    public AiPurchaseSuggestion dismiss(Long id) {
        AiPurchaseSuggestion suggestion = findForCurrentEmpresa(id);
        requireDraft(suggestion, "Solo las sugerencias en borrador se pueden descartar.");
        suggestion.setStatus(AiPurchaseSuggestionStatus.DISMISSED);
        suggestion.setDismissedAt(Instant.now());
        suggestion.setApprovedAt(null);
        return repository.save(suggestion);
    }

    private AiPurchaseSuggestion findForCurrentEmpresa(Long id) {
        Long empresaId = currentEmpresaId();
        return repository
                .findByIdAndEmpresa_Id(id, empresaId)
                .orElseThrow(() -> new BusinessException(
                        HttpStatus.NOT_FOUND, "Sugerencia de compra no encontrada o no pertenece a tu empresa."));
    }

    private Long currentEmpresaId() {
        return tenantScopeService.requireCurrentUsuarioWithEmpresa().getEmpresa().getId();
    }

    private static void requireDraft(AiPurchaseSuggestion suggestion, String message) {
        if (suggestion.getStatus() != AiPurchaseSuggestionStatus.DRAFT) {
            throw new BusinessException(HttpStatus.CONFLICT, message);
        }
    }

    static BigDecimal validateQuantity(BigDecimal value) {
        if (value == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La cantidad sugerida es requerida.");
        }
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La cantidad sugerida debe ser mayor que cero.");
        }
        BigDecimal normalized = value.stripTrailingZeros();
        if (normalized.scale() > 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La cantidad sugerida debe ser un numero entero.");
        }
        return value.setScale(4, RoundingMode.UNNECESSARY);
    }

    private static String normalizeText(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        if (trimmed.length() > maxLength) {
            return trimmed.substring(0, maxLength);
        }
        return trimmed;
    }
}

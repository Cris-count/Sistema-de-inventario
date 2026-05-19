package com.inventario.service.ai.recommendation;

import com.inventario.domain.entity.AiRecommendation;
import com.inventario.domain.entity.AiRecommendationStatus;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.AiRecommendationRepository;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AiRecommendationLifecycleService {

    private final AiRecommendationRepository repository;
    private final AiTenantScopeService tenantScopeService;

    @Transactional(readOnly = true)
    public List<AiRecommendation> listForCurrentUser(AiRecommendationStatus statusFilter) {
        Usuario user = tenantScopeService.requireCurrentUsuarioWithEmpresa();
        Long empresaId = user.getEmpresa().getId();
        if (statusFilter != null) {
            return repository.findByEmpresa_IdAndStatusOrderByCreatedAtDesc(empresaId, statusFilter);
        }
        return repository.findByEmpresa_IdOrderByCreatedAtDesc(empresaId);
    }

    @Transactional
    public AiRecommendation accept(Long id) {
        return transition(id, AiRecommendationStatus.PENDING, AiRecommendationStatus.ACCEPTED);
    }

    @Transactional
    public AiRecommendation dismiss(Long id) {
        return transition(id, AiRecommendationStatus.PENDING, AiRecommendationStatus.DISMISSED);
    }

    @Transactional
    public AiRecommendation execute(Long id) {
        return transition(id, AiRecommendationStatus.ACCEPTED, AiRecommendationStatus.EXECUTED);
    }

    private AiRecommendation transition(Long id, AiRecommendationStatus from, AiRecommendationStatus to) {
        Usuario user = tenantScopeService.requireCurrentUsuarioWithEmpresa();
        Long empresaId = user.getEmpresa().getId();
        AiRecommendation row =
                repository
                        .findByIdAndEmpresa_Id(id, empresaId)
                        .orElseThrow(
                                () ->
                                        new BusinessException(
                                                HttpStatus.NOT_FOUND,
                                                "Recomendación no encontrada o no pertenece a tu empresa."));

        if (row.getStatus() != from) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Transición inválida para el estado actual de la recomendación.");
        }
        row.setStatus(to);
        return repository.save(row);
    }
}

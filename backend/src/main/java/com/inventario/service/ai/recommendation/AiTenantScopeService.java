package com.inventario.service.ai.recommendation;

import com.inventario.domain.entity.Usuario;
import com.inventario.service.CurrentUserService;
import org.springframework.stereotype.Service;

/**
 * Resuelve el tenant para aislar recomendaciones IA por empresa.
 */
@Service
public class AiTenantScopeService {

    private final CurrentUserService currentUserService;

    public AiTenantScopeService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    /**
     * Usa siempre la empresa asociada al usuario autenticado (tenant SaaS real).
     */
    public AiTenantScope resolveForUsuario(Usuario usuario) {
        if (usuario.getEmpresa() == null || usuario.getEmpresa().getId() == null) {
            throw new IllegalStateException("Usuario sin empresa: no se puede persistir recomendaciones IA.");
        }
        return new AiTenantScope(usuario.getEmpresa().getId());
    }

    /** Usuario actual con empresa operativa (misma validación que el resto de la API multiempresa). */
    public Usuario requireCurrentUsuarioWithEmpresa() {
        currentUserService.requireEmpresa();
        return currentUserService.requireUsuario();
    }
}

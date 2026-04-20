package com.inventario.service.saas;

import com.inventario.domain.entity.Suscripcion;
import com.inventario.domain.repository.BodegaRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.repository.SuscripcionRepository;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlanEntitlementService {

    private final SuscripcionRepository suscripcionRepository;
    private final BodegaRepository bodegaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProductoRepository productoRepository;

    @Transactional(readOnly = true)
    public PlanEntitlements resolveForEmpresa(Long empresaId) {
        Suscripcion s = suscripcionRepository.findByEmpresaId(empresaId).orElse(null);
        if (s == null || s.getPlan() == null) {
            return PlanEntitlementsRegistry.forPlanCodigo(null);
        }
        return PlanEntitlementsRegistry.forPlanCodigo(s.getPlan().getCodigo());
    }

    @Transactional(readOnly = true)
    public void requireModulo(Long empresaId, String moduloCodigo) {
        PlanEntitlements e = resolveForEmpresa(empresaId);
        if (!e.tieneModulo(moduloCodigo)) {
            // Propaga el módulo exacto para que el cliente recomiende el primer plan
            // superior que lo desbloquea (ver MiEmpresaPage.contextualRecommendation).
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "Esta acción no está disponible en tu plan actual. Puedes ampliar tu plan para usarla.",
                    PlanBlockCodes.MODULO_NO_INCLUIDO,
                    moduloCodigo,
                    null);
        }
    }

    @Transactional(readOnly = true)
    public void requireReporte(Long empresaId) {
        PlanEntitlements e = resolveForEmpresa(empresaId);
        if (!e.tieneModulo(PlanEntitlementCodes.REPORTES_BASICOS)
                && !e.tieneModulo(PlanEntitlementCodes.REPORTES_AVANZADOS)) {
            // El gate se dispara sólo cuando la empresa no tiene ningún módulo de
            // reportes: el mínimo módulo que lo desbloquea es REPORTES_BASICOS.
            // Así el cliente recomienda el plan más pequeño que lo incluye.
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    "Los reportes no están incluidos en tu plan actual. Actualiza tu plan para acceder a reportes y exportaciones.",
                    PlanBlockCodes.REPORTES_NO_INCLUIDO,
                    PlanEntitlementCodes.REPORTES_BASICOS,
                    null);
        }
    }

    @Transactional(readOnly = true)
    public void assertPuedeCrearBodega(Long empresaId) {
        PlanEntitlements e = resolveForEmpresa(empresaId);
        if (e.maxBodegas() != null) {
            long n = bodegaRepository.countByEmpresa_Id(empresaId);
            if (n >= e.maxBodegas()) {
                throw new BusinessException(
                        HttpStatus.FORBIDDEN,
                        "Has alcanzado el límite de bodegas de tu plan. Amplía tu plan para crear más bodegas.",
                        PlanBlockCodes.LIMITE_BODEGAS);
            }
        }
    }

    /**
     * Primera bodega permitida sin {@code multi_bodega}; a partir de la segunda exige el módulo y el límite.
     */
    @Transactional(readOnly = true)
    public void assertPuedeAgregarBodega(Long empresaId) {
        assertPuedeCrearBodega(empresaId);
        long n = bodegaRepository.countByEmpresa_Id(empresaId);
        if (n >= 1) {
            requireModulo(empresaId, PlanEntitlementCodes.MULTI_BODEGA);
        }
    }

    @Transactional(readOnly = true)
    public void assertPuedeCrearUsuario(Long empresaId) {
        PlanEntitlements e = resolveForEmpresa(empresaId);
        if (e.maxUsuarios() != null) {
            long n = usuarioRepository.countByEmpresa_Id(empresaId);
            if (n >= e.maxUsuarios()) {
                throw new BusinessException(
                        HttpStatus.FORBIDDEN,
                        "Has alcanzado el límite de usuarios de tu plan. Amplía tu plan para sumar más personas.",
                        PlanBlockCodes.LIMITE_USUARIOS);
            }
        }
    }

    @Transactional(readOnly = true)
    public void assertPuedeCrearProducto(Long empresaId) {
        PlanEntitlements e = resolveForEmpresa(empresaId);
        if (e.maxProductos() != null) {
            long n = productoRepository.countByEmpresa_Id(empresaId);
            if (n >= e.maxProductos()) {
                throw new BusinessException(
                        HttpStatus.FORBIDDEN,
                        "Has alcanzado el límite de productos de tu plan. Amplía tu plan para seguir creciendo.",
                        PlanBlockCodes.LIMITE_PRODUCTOS);
            }
        }
    }

    /**
     * Valida que el uso actual de la empresa no supere los límites del plan destino (downgrade).
     */
    @Transactional(readOnly = true)
    public void assertUsoCompatibleConPlanDestino(Long empresaId, String destinoPlanCodigo) {
        PlanEntitlements target = PlanEntitlementsRegistry.forPlanCodigo(destinoPlanCodigo);
        if (target.maxBodegas() != null) {
            long n = bodegaRepository.countByEmpresa_Id(empresaId);
            if (n > target.maxBodegas()) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "No puedes bajar a este plan mientras tengas más bodegas de las que permite. "
                                + "Reduce bodegas o elige un plan que se ajuste a tu operación.",
                        PlanBlockCodes.DOWNGRADE_EXCESO_BODEGAS);
            }
        }
        if (target.maxUsuarios() != null) {
            long n = usuarioRepository.countByEmpresa_Id(empresaId);
            if (n > target.maxUsuarios()) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "No puedes bajar a este plan mientras tengas más usuarios de los que permite. "
                                + "Ajusta tu equipo y vuelve a intentarlo.",
                        PlanBlockCodes.DOWNGRADE_EXCESO_USUARIOS);
            }
        }
        if (target.maxProductos() != null) {
            long n = productoRepository.countByEmpresa_Id(empresaId);
            if (n > target.maxProductos()) {
                throw new BusinessException(
                        HttpStatus.CONFLICT,
                        "No puedes bajar a este plan mientras tengas más productos de los que permite. "
                                + "Reduce el catálogo y vuelve a intentarlo.",
                        PlanBlockCodes.DOWNGRADE_EXCESO_PRODUCTOS);
            }
        }
    }
}

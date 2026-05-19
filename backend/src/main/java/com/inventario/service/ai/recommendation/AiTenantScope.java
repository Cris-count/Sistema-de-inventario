package com.inventario.service.ai.recommendation;

/**
 * Alcance multiempresa para persistencia de recomendaciones IA.
 *
 * <p>Fuente canónica del tenant en esta API es {@code empresaId} del usuario autenticado
 * ({@link com.inventario.domain.entity.Usuario#getEmpresa()}), no el {@code userId}.
 */
public record AiTenantScope(long empresaId) {}

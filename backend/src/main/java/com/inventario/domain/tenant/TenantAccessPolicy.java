package com.inventario.domain.tenant;

/**
 * Política HTTP para recursos con ámbito por empresa (multi-tenant).
 * <p>
 * <strong>404 Not Found</strong> — Se usa cuando el cliente pide un recurso por id y:
 * <ul>
 *     <li>no existe, o</li>
 *     <li>existe pero pertenece a otra empresa (equivalente a “no existe” para ese usuario, sin revelar ids ajenos).</li>
 * </ul>
 * Las consultas deben usar siempre {@code findByIdAndEmpresaId} (o equivalente) y traducir vacío a 404.
 * <p>
 * <strong>403 Forbidden</strong> — Usuario autenticado pero:
 * <ul>
 *     <li>sin rol suficiente para la operación ({@code @PreAuthorize}), o</li>
 *     <li>violación de reglas de negocio explícitas del tenant (p. ej. usuario sin empresa, empresa inactiva,
 *         intento de asignar {@code SUPER_ADMIN} sin permiso).</li>
 * </ul>
 * No usar 403 solo por “recurso en otro tenant”; eso sigue siendo 404 para evitar fugas de existencia.
 */
public final class TenantAccessPolicy {

    private TenantAccessPolicy() {}
}

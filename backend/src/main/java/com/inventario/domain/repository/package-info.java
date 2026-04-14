/**
 * Persistencia JPA (Spring Data). <strong>Regla crítica multi-tenant:</strong> en código de aplicación
 * (servicios, controladores) <strong>nunca</strong> usar {@code findById(id)} ni {@code getOne} sobre entidades
 * que llevan {@code empresa_id} (producto, categoría, bodega, proveedor, usuario, movimiento, etc.).
 * Usar siempre consultas con {@code empresaId} (p. ej. {@code findByIdAndEmpresaId}) a través de
 * {@link com.inventario.service.tenant.TenantEntityLoader} o servicios en {@code com.inventario.service.catalog}.
 * <p>
 * Excepciones controladas: semillas ({@code com.inventario.bootstrap}), seguridad (carga por email),
 * y referencias {@code getReferenceById} solo tras validar el id en el tenant correcto.
 */
package com.inventario.domain.repository;

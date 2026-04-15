package com.inventario.service.saas;

import java.util.Collections;
import java.util.Set;

/**
 * Límites y módulos efectivos de un plan.
 *
 * @param maxUsuarios   máximo de usuarios; {@code null} = ilimitado
 * @param maxBodegas    máximo de bodegas; {@code null} = ilimitado
 * @param maxProductos  máximo de productos; {@code null} = ilimitado
 */
public record PlanEntitlements(Set<String> modulos, Integer maxUsuarios, Integer maxBodegas, Integer maxProductos) {

    public PlanEntitlements {
        modulos = modulos != null ? Collections.unmodifiableSet(modulos) : Set.of();
    }

    public boolean tieneModulo(String codigo) {
        return codigo != null && modulos.contains(codigo);
    }
}

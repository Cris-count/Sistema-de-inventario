package com.inventario.service.saas;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static com.inventario.service.saas.PlanEntitlementCodes.*;

/**
 * Matriz funcional oficial plan → módulos + límites.
 * Códigos de plan en BD: STARTER, PROFESIONAL, EMPRESA (mapeados a STARTER / PRO / EMPRESARIAL).
 * <p>
 * {@code maxProductos} es el tope de <strong>productos en catálogo (por empresa)</strong>, alineado a la
 * política comercial “hasta N referencias por bodega”: total = bodegas × tope por bodega.
 */
public final class PlanEntitlementsRegistry {

    private static final PlanEntitlements STARTER = new PlanEntitlements(
            Set.of(INVENTARIO_BASICO, CATEGORIAS, MOVIMIENTOS_BASICOS, CONSULTA_STOCK),
            3,
            2,
            2 * 1000);

    private static final PlanEntitlements PRO = new PlanEntitlements(
            union(
                    STARTER.modulos(),
                    MULTI_BODEGA,
                    TRANSFERENCIAS,
                    AJUSTES_INVENTARIO,
                    PROVEEDORES,
                    USUARIOS,
                    CONFIGURACION_EMPRESA,
                    REPORTES_BASICOS,
                    HISTORIAL_MOVIMIENTOS),
            10,
            5,
            5 * 2500);

    private static final PlanEntitlements EMPRESARIAL = new PlanEntitlements(
            union(
                    PRO.modulos(),
                    ROLES_AVANZADOS,
                    REPORTES_AVANZADOS,
                    AUDITORIA,
                    MULTI_SEDE,
                    INTEGRACIONES,
                    SOPORTE_PRIORITARIO),
            25,
            10,
            10 * 3000);

    private static final Map<String, PlanEntitlements> BY_PLAN_CODIGO = Map.of(
            "STARTER", STARTER,
            "PROFESIONAL", PRO,
            "EMPRESA", EMPRESARIAL);

    private PlanEntitlementsRegistry() {}

    private static Set<String> union(Set<String> base, String... extra) {
        LinkedHashSet<String> s = new LinkedHashSet<>(base);
        for (String e : extra) {
            s.add(e);
        }
        return Set.copyOf(s);
    }

    /**
     * Resuelve entitlements por código de plan persistido en {@code saas_plan.codigo}.
     * Si el código no está en la matriz, aplica STARTER (conservador).
     */
    public static PlanEntitlements forPlanCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return STARTER;
        }
        String key = codigo.trim().toUpperCase(Locale.ROOT);
        return BY_PLAN_CODIGO.getOrDefault(key, STARTER);
    }
}

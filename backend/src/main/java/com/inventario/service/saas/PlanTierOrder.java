package com.inventario.service.saas;

import java.util.Locale;

/**
 * Orden de planes para clasificar upgrade / downgrade. Códigos persistidos: STARTER, PROFESIONAL, EMPRESA.
 */
public final class PlanTierOrder {

    private PlanTierOrder() {}

    public static int tier(String planCodigo) {
        if (planCodigo == null || planCodigo.isBlank()) {
            return 0;
        }
        return switch (planCodigo.trim().toUpperCase(Locale.ROOT)) {
            case "STARTER" -> 1;
            case "PROFESIONAL" -> 2;
            case "EMPRESA" -> 3;
            default -> 0;
        };
    }

    public static boolean isUpgrade(String actual, String destino) {
        return tier(destino) > tier(actual);
    }

    public static boolean isDowngrade(String actual, String destino) {
        return tier(destino) < tier(actual) && tier(destino) > 0 && tier(actual) > 0;
    }
}

package com.inventario.service.saas;

import com.inventario.domain.entity.SaasPlan;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Catálogo público de planes: precios, moneda y textos mostrados en landing/onboarding.
 * Única definición en código para semilla y sincronización; la API lee desde {@code saas_plan}.
 */
public final class SaasPlanPublicCatalog {

    public record Row(
            String codigo,
            String nombre,
            String descripcion,
            BigDecimal precioMensual,
            String moneda,
            int maxBodegas,
            int maxUsuarios,
            String features,
            int orden) {}

    /** Precios mensuales en COP (estrategia de entrada PYMES Colombia). */
    public static final List<Row> ROWS = List.of(
            new Row(
                    "STARTER",
                    "Starter",
                    "Control profesional de inventario desde el primer día.",
                    new BigDecimal("19900"),
                    "COP",
                    2,
                    5,
                    "Productos y categorías|Movimientos de entrada y salida|Consulta de existencias y alertas|Soporte por correo",
                    1),
            new Row(
                    "PROFESIONAL",
                    "Pro",
                    "Diseñado para crecer con tu empresa: más bodegas, equipo ampliado y reportes.",
                    new BigDecimal("69900"),
                    "COP",
                    10,
                    25,
                    "Más bodegas y usuarios|Transferencias y ajustes|Proveedores y roles ampliados|Reportes kardex y exportación CSV",
                    2),
            new Row(
                    "EMPRESA",
                    "Empresarial",
                    "Escala sin límites para operaciones que exigen el máximo control.",
                    new BigDecimal("149900"),
                    "COP",
                    999,
                    999,
                    "Límites ampliados en bodegas y usuarios|Módulos avanzados del plan|Prioridad en soporte|Hoja de ruta multi-sede e integraciones",
                    3));

    private SaasPlanPublicCatalog() {}

    public static Optional<Row> findRowByCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return Optional.empty();
        }
        String key = codigo.trim().toUpperCase(Locale.ROOT);
        return ROWS.stream().filter(r -> r.codigo().equals(key)).findFirst();
    }

    public static SaasPlan toNewEntity(Row r, Instant createdAt) {
        return SaasPlan.builder()
                .codigo(r.codigo())
                .nombre(r.nombre())
                .descripcion(r.descripcion())
                .precioMensual(r.precioMensual())
                .moneda(r.moneda())
                .maxBodegas(r.maxBodegas())
                .maxUsuarios(r.maxUsuarios())
                .features(r.features())
                .orden(r.orden())
                .activo(true)
                .createdAt(createdAt)
                .build();
    }

    /** Alinea una fila persistida con el catálogo (precios y textos comerciales). */
    public static void applyCatalogTo(SaasPlan plan, Row r) {
        plan.setNombre(r.nombre());
        plan.setDescripcion(r.descripcion());
        plan.setPrecioMensual(r.precioMensual());
        plan.setMoneda(r.moneda());
        plan.setMaxBodegas(r.maxBodegas());
        plan.setMaxUsuarios(r.maxUsuarios());
        plan.setFeatures(r.features());
        plan.setOrden(r.orden());
    }
}

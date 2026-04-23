package com.inventario.time;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Zona horaria para interpretar fechas de negocio en filtros y rangos diarios (listados, export, kardex),
 * alineada con ventas y panel de abastecimiento. No altera cómo se persisten los {@code Instant}.
 */
public final class ZonaNegocio {

    public static final ZoneId ZONE_ID = ZoneId.of("America/Bogota");

    private ZonaNegocio() {}

    public static Instant inicioDiaInclusive(LocalDate dia) {
        return dia.atStartOfDay(ZONE_ID).toInstant();
    }

    /** Primer instante del día siguiente a {@code hastaInclusive} (límite exclusivo del rango). */
    public static Instant finRangoExclusivo(LocalDate hastaInclusive) {
        return hastaInclusive.plusDays(1).atStartOfDay(ZONE_ID).toInstant();
    }
}

package com.inventario.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Política de sesión refresh (documentada explícitamente):
 *
 * <ul>
 *   <li><strong>Expiración absoluta por familia</strong>: {@code familyAbsoluteTtlMs} fija el fin de la cadena desde el
 *       primer token emitido tras login/MFA. Rotar el refresh <em>no</em> amplía ese tope.</li>
 *   <li><strong>TTL de rotación (por token opaco)</strong>: {@code expirationMs} limita cuánto puede vivir cada token
 *       concreto; su {@code expires_at} es {@code min(ahora + expirationMs, familyExpiresAt)}.</li>
 *   <li><strong>Sesiones concurrentes</strong>: {@code maxActiveFamiliesPerUser} = 0 permite familias ilimitadas; &gt; 0
 *       revoca la familia activa más antigua antes de crear una nueva (punto de extensión documentado aquí).</li>
 * </ul>
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.refresh-token")
public class RefreshTokenProperties {

    /**
     * TTL máximo de cada token opaco (ventana de uso de ese valor concreto). Siempre acotado por {@code familyExpiresAt}.
     */
    private long expirationMs = 1_209_600_000L;

    /**
     * Vida máxima absoluta de la familia desde el primer refresh del login (no se alarga al rotar).
     */
    private long familyAbsoluteTtlMs = 2_592_000_000L;

    /** Pepper para hash de almacenamiento; si {@link #pepperRequired} es true debe ser no vacío al arrancar. */
    private String hashPepper = "";

    /**
     * Si true, falla el arranque sin {@code hashPepper} no vacío. En dev/test suele ser false; en producción debe ser true
     * vía {@code REFRESH_TOKEN_PEPPER_REQUIRED=true} y {@code REFRESH_TOKEN_PEPPER}.
     */
    private boolean pepperRequired = false;

    /**
     * Máximo de familias activas por usuario; 0 = sin tope (comportamiento por defecto). &gt; 0 revoca la familia activa
     * más antigua hasta dejar hueco antes de emitir una nueva.
     */
    private int maxActiveFamiliesPerUser = 0;
}

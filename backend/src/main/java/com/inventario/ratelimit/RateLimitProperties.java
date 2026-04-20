package com.inventario.ratelimit;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Límites por ventana fija. {@link RateLimitBackendType#MEMORY} por JVM; {@link RateLimitBackendType#REDIS} compartido
 * entre instancias (ver {@link RateLimitConfiguration}).
 */
@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    private boolean enabled = true;

    /**
     * {@code memory}: contadores en JVM (desarrollo, tests, fallback). {@code redis}: ventana fija en Redis
     * (requiere {@code app.rate-limit.redis.host} no vacío).
     */
    private RateLimitBackendType backend = RateLimitBackendType.MEMORY;

    /**
     * Con {@code backend=redis}: si Redis falla en tiempo de ejecución, usar memoria por instancia (por defecto {@code true},
     * degradación operativa visible en logs/health/métricas). Si {@code false}, se propaga la excepción (puede producir 5xx
     * en rutas limitadas; solo entornos que prefieran fallar cerrado).
     */
    private boolean allowMemoryFallbackOnRedisFailure = true;

    private Redis redis = new Redis();

    /**
     * Si es true, la IP cliente se toma del primer valor de {@code X-Forwarded-For} (solo detrás de proxy de confianza).
     */
    private boolean trustXForwardedFor = false;

    /**
     * Opcional: se concatena al material antes del hash de email/challenge para endurecer claves (no sustituye límites por IP).
     */
    private String hashPepper = "";

    /** Inicializados no nulos; Spring enlaza propiedades anidadas vía getter. */
    private Login login = new Login();
    private MfaVerify mfaVerify = new MfaVerify();
    private Onboarding onboarding = new Onboarding();
    private Billing billing = new Billing();
    private AuthRefresh authRefresh = new AuthRefresh();
    private AuthLogout authLogout = new AuthLogout();

    @Getter
    @Setter
    public static class Redis {
        private String host = "";
        private int port = 6379;
        private String password = "";
        private int database = 0;
        /** Timeout de comandos hacia Redis (failover a memoria si aplica). */
        private Duration commandTimeout = Duration.ofMillis(800);
    }

    @Getter
    @Setter
    public static class Login {
        /** Máximo de intentos de login por IP y ventana. {@code 0} desactiva este cubo. */
        private int maxPerIpPerWindow = 30;
        /** Máximo de intentos por cuenta (huella de email) y ventana; mitiga spraying a muchas cuentas desde una IP y muchas IPs sobre una cuenta. */
        private int maxPerEmailPerWindow = 15;
        private int windowSeconds = 60;
    }

    @Getter
    @Setter
    public static class MfaVerify {
        /** Por IP; complementa el límite por {@code jti} en base de datos. */
        private int maxPerIpPerWindow = 40;
        /** Por challenge (hash del token); limita abuso del mismo challenge desde muchas IPs. {@code 0} desactiva. */
        private int maxPerChallengePerWindow = 25;
        private int windowSeconds = 60;
    }

    @Getter
    @Setter
    public static class Onboarding {
        private int maxPerIpPerWindow = 10;
        private int maxPerEmailPerWindow = 8;
        private int windowSeconds = 3600;
    }

    @Getter
    @Setter
    public static class Billing {
        /** Si true, aplica solo cubo por IP en POST públicos de facturación (defensa en profundidad). */
        private boolean ipLimited = false;
        private int maxPerIpPerWindow = 120;
        private int windowSeconds = 60;
    }

    @Getter
    @Setter
    public static class AuthRefresh {
        private int maxPerIpPerWindow = 45;
        /** Huella del token (sin loguear el valor); 0 desactiva. */
        private int maxPerTokenFingerprintPerWindow = 30;
        private int windowSeconds = 60;
    }

    @Getter
    @Setter
    public static class AuthLogout {
        private int maxPerIpPerWindow = 60;
        private int maxPerTokenFingerprintPerWindow = 40;
        private int windowSeconds = 60;
    }
}

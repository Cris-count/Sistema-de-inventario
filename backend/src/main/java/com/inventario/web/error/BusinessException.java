package com.inventario.web.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    /** Código estable para el cliente (p. ej. {@code PLAN_LIMITE_USUARIOS}); opcional. */
    private final String blockCode;
    /**
     * Código técnico del módulo afectado (p. ej. {@code transferencias},
     * {@code reportes_basicos}). Sólo se usa con {@code blockCode=PLAN_MODULO_NO_INCLUIDO}
     * o {@code PLAN_REPORTES_NO_INCLUIDO}; en el resto queda {@code null}.
     * Permite al cliente recomendar el plan exacto que desbloquea ese módulo.
     */
    private final String blockModule;
    /** Para 429: segundos sugeridos en cabecera {@code Retry-After}; opcional. */
    private final Integer retryAfterSeconds;

    public BusinessException(HttpStatus status, String message) {
        this(status, message, null, null, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode) {
        this(status, message, blockCode, null, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode, Integer retryAfterSeconds) {
        this(status, message, blockCode, null, retryAfterSeconds);
    }

    /**
     * Constructor completo con {@code blockModule}. Usar cuando el bloqueo referencia
     * un módulo concreto del catálogo ({@code PlanEntitlementCodes}).
     */
    public BusinessException(
            HttpStatus status,
            String message,
            String blockCode,
            String blockModule,
            Integer retryAfterSeconds) {
        super(message);
        this.status = status;
        this.blockCode = blockCode;
        this.blockModule = blockModule;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

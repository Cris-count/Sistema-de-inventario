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

    /**
     * Código estable para el cliente (p. ej. {@link ApiErrorMessages#CATEGORY_ALREADY_EXISTS_CODE});
     * distinto de {@link #blockCode} (planes / MFA). Se expone en Problem Details como {@code code}.
     */
    private final String errorCode;

    public BusinessException(HttpStatus status, String message) {
        this(status, message, null, null, null, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode) {
        this(status, message, blockCode, null, null, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode, Integer retryAfterSeconds) {
        this(status, message, blockCode, null, retryAfterSeconds, null);
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
        this(status, message, blockCode, blockModule, retryAfterSeconds, null);
    }

    /**
     * Conflicto de negocio con código de aplicación para el cliente (no usa {@code blockCode} de planes).
     */
    public static BusinessException conflictWithCode(String message, String errorCode) {
        return new BusinessException(HttpStatus.CONFLICT, message, null, null, null, errorCode);
    }

    private BusinessException(
            HttpStatus status,
            String message,
            String blockCode,
            String blockModule,
            Integer retryAfterSeconds,
            String errorCode) {
        super(message);
        this.status = status;
        this.blockCode = blockCode;
        this.blockModule = blockModule;
        this.retryAfterSeconds = retryAfterSeconds;
        this.errorCode = errorCode;
    }
}

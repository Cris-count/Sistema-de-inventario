package com.inventario.web.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    /** Código estable para el cliente (p. ej. {@code PLAN_LIMITE_USUARIOS}); opcional. */
    private final String blockCode;
    /** Para 429: segundos sugeridos en cabecera {@code Retry-After}; opcional. */
    private final Integer retryAfterSeconds;

    public BusinessException(HttpStatus status, String message) {
        this(status, message, null, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode) {
        this(status, message, blockCode, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode, Integer retryAfterSeconds) {
        super(message);
        this.status = status;
        this.blockCode = blockCode;
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

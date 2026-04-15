package com.inventario.web.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class BusinessException extends RuntimeException {
    private final HttpStatus status;
    /** Código estable para el cliente (p. ej. {@code PLAN_LIMITE_USUARIOS}); opcional. */
    private final String blockCode;

    public BusinessException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public BusinessException(HttpStatus status, String message, String blockCode) {
        super(message);
        this.status = status;
        this.blockCode = blockCode;
    }
}

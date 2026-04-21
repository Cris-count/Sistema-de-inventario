package com.inventario.web.error;

/**
 * Textos de {@code detail} alineados entre {@code GlobalExceptionHandler}, filtros JWT y
 * {@link org.springframework.security.web.SecurityFilterChain#exceptionHandling}.
 */
public final class ApiErrorMessages {

    public static final String FORBIDDEN_DETAIL =
            "No tiene permisos para esta operación con su rol actual. Si cree que es un error, contacte al administrador.";

    public static final String UNAUTHORIZED_JWT_DETAIL =
            "Token inválido, expirado o usuario inactivo. Cierre sesión e inicie de nuevo.";

    public static final String UNAUTHORIZED_ANONYMOUS_DETAIL =
            "No autenticado. Inicie sesión y envíe el token en el encabezado Authorization: Bearer.";

    public static final String CATEGORY_ALREADY_EXISTS_DETAIL = "La categoría ya existe";

    /** Propiedad {@code code} en Problem Details para el cliente. */
    public static final String CATEGORY_ALREADY_EXISTS_CODE = "CATEGORY_ALREADY_EXISTS";

    private ApiErrorMessages() {}
}

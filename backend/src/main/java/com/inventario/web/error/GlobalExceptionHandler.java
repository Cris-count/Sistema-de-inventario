package com.inventario.web.error;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        if (ex.getStatus() == HttpStatus.TOO_MANY_REQUESTS) {
            pd.setTitle("Límite de solicitudes");
        } else {
            pd.setTitle("Error de negocio");
        }
        if (ex.getBlockCode() != null && !ex.getBlockCode().isBlank()) {
            pd.setProperty("blockCode", ex.getBlockCode());
        }
        if (ex.getBlockModule() != null && !ex.getBlockModule().isBlank()) {
            pd.setProperty("blockModule", ex.getBlockModule());
        }
        if (ex.getErrorCode() != null && !ex.getErrorCode().isBlank()) {
            pd.setProperty("code", ex.getErrorCode());
            pd.setProperty("message", ex.getMessage());
        }
        ResponseEntity.BodyBuilder b = ResponseEntity.status(ex.getStatus());
        if (ex.getRetryAfterSeconds() != null && ex.getRetryAfterSeconds() > 0) {
            b.header(HttpHeaders.RETRY_AFTER, ex.getRetryAfterSeconds().toString());
        }
        return b.body(pd);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, msg);
        pd.setTitle("Validación");
        return pd;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        pd.setTitle("Autenticación");
        return pd;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ApiErrorMessages.FORBIDDEN_DETAIL);
        pd.setTitle("Autorización");
        return pd;
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ProblemDetail handleDataIntegrity(DataIntegrityViolationException ex) {
        if (isCategoriaNombreUniqueViolation(ex)) {
            ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                    HttpStatus.CONFLICT, ApiErrorMessages.CATEGORY_ALREADY_EXISTS_DETAIL);
            pd.setTitle("Conflicto");
            pd.setProperty("code", ApiErrorMessages.CATEGORY_ALREADY_EXISTS_CODE);
            pd.setProperty("message", ApiErrorMessages.CATEGORY_ALREADY_EXISTS_DETAIL);
            return pd;
        }
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el recurso (restricción de datos).");
        pd.setTitle("Error");
        return pd;
    }

    private static boolean isCategoriaNombreUniqueViolation(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause().getMessage();
        return msg != null && msg.contains("uk_categoria_empresa_nombre");
    }
}

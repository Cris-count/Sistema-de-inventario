package com.inventario.web.dto.auth;

import java.util.List;

/**
 * Datos para enrolar un autenticador (mostrar QR / introducir secreto una sola vez).
 * {@code backupCodes} se muestran en claro solo en esta respuesta; guárdelos de forma segura.
 */
public record MfaSetupResponse(
        String secretBase32,
        String otpauthUri,
        String issuer,
        List<String> backupCodes
) {}

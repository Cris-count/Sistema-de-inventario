package com.inventario.web.dto.auth;

/**
 * Cuerpo opcional: si falta {@code refreshToken}, el logout no revoca filas en BD (idempotente).
 */
public record LogoutRequest(String refreshToken) {}

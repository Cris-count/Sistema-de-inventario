package com.inventario.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Misma política que {@link SecurityConfig#corsConfigurationSource()} para respuestas escritas en filtros. */
final class CorsHeaders {

    private CorsHeaders() {}

    static void applyForBrowserDev(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin == null) {
            return;
        }
        if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }
}

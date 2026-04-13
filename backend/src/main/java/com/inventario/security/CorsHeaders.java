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
        if ("http://localhost:4200".equals(origin) || "http://127.0.0.1:4200".equals(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
    }
}

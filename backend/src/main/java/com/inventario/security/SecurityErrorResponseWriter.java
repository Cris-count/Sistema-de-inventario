package com.inventario.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Respuestas JSON tipo Problem Details (RFC 7807) para errores generados fuera del {@code DispatcherServlet}
 * (filtro JWT, {@code AuthenticationEntryPoint}, {@code AccessDeniedHandler}).
 */
public final class SecurityErrorResponseWriter {

    private SecurityErrorResponseWriter() {}

    public static void writeProblemDetail(
            HttpServletRequest request,
            HttpServletResponse response,
            int status,
            String title,
            String detail) throws IOException {
        CorsHeaders.applyForBrowserDev(request, response);
        response.setStatus(status);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        String body = String.format(
                java.util.Locale.ROOT,
                "{\"type\":\"about:blank\",\"title\":\"%s\",\"status\":%d,\"detail\":\"%s\"}",
                escapeJson(title),
                status,
                escapeJson(detail));
        response.getWriter().write(body);
    }

    private static String escapeJson(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}

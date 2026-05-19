package com.inventario.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cliente HTTP hacia el microservicio Python de IA (FastAPI).
 *
 * <p>Spring Boot valida JWT y tenant antes de reenviar la petición; el servicio Python no debe confiar en {@code company_id}
 * sin esta capa intermedia.</p>
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.ai")
public class AiIntegrationProperties {

    /** Base URL sin barra final; p.ej. {@code http://localhost:8000}. En Docker Compose usar el nombre del servicio. */
    private String serviceUrl = "http://localhost:8000";

    /** Timeout de conexión TCP (creación del socket). */
    private long connectTimeoutMs = 5_000L;

    /** Timeout máximo esperando respuesta HTTP completa desde la IA. */
    private long readTimeoutMs = 20_000L;
}

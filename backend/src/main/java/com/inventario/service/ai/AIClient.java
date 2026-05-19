package com.inventario.service.ai;

import com.inventario.config.AiIntegrationProperties;
import com.inventario.web.dto.ai.AIServiceChatRequestDto;
import com.inventario.web.dto.ai.AiPythonChatResponsePayload;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Cliente HTTP hacia FastAPI ({@code ai-service}). Los errores se absorben aquí (Mono vacío).
 *
 * <p>Futuro: cabeceras de correlación ({@code X-Request-Id}), circuit breaker, métricas Micrometer.</p>
 */
@Slf4j
@Service
public class AIClient {

    private final AiIntegrationProperties aiIntegrationProperties;
    private final WebClient aiInventoryAssistantWebClient;

    public AIClient(
            AiIntegrationProperties aiIntegrationProperties,
            @Qualifier("aiInventoryAssistantWebClient") WebClient aiInventoryAssistantWebClient) {
        this.aiIntegrationProperties = aiIntegrationProperties;
        this.aiInventoryAssistantWebClient = aiInventoryAssistantWebClient;
    }

    /**
     * Invoca el microservicio Python. No propaga {@link WebClientResponseException} al controller.
     *
     * @return payload o Mono vacío ante timeout / HTTP error / fallo de red / decode.
     */
    public Mono<AiPythonChatResponsePayload> chat(AIServiceChatRequestDto body) {
        long timeoutMs = Math.max(100L, aiIntegrationProperties.getReadTimeoutMs());
        return aiInventoryAssistantWebClient
                .post()
                .uri("/api/v1/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(AiPythonChatResponsePayload.class)
                .timeout(Duration.ofMillis(timeoutMs))
                .onErrorResume(ex -> {
                    if (ex instanceof WebClientResponseException w) {
                        log.warn(
                                "AI service responded HTTP {} — {}",
                                w.getStatusCode().value(),
                                sanitize(w.getResponseBodyAsString()));
                    } else {
                        log.warn("AI service call failed — {}", ex.toString());
                    }
                    return Mono.empty();
                });
    }

    private static String sanitize(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        String trimmed = raw.trim();
        return trimmed.length() > 240 ? trimmed.substring(0, 240) + "…" : trimmed;
    }
}

package com.inventario.config;

import io.netty.channel.ChannelOption;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class AiWebClientConfiguration {

    /** Bean dedicado para no interferir con clientes HTTP MVC existentes. */
    @Bean(name = "aiInventoryAssistantWebClient")
    public WebClient aiInventoryAssistantWebClient(AiIntegrationProperties props) {
        String raw = props.getServiceUrl() != null ? props.getServiceUrl().trim() : "";
        String baseUrl =
                raw.endsWith("/") ? raw.substring(0, raw.length() - 1) : raw;

        HttpClient reactorHttpClient =
                HttpClient.create()
                        .responseTimeout(Duration.ofMillis(Math.max(100L, props.getReadTimeoutMs())))
                        .option(
                                ChannelOption.CONNECT_TIMEOUT_MILLIS,
                                (int) Math.min(Math.max(props.getConnectTimeoutMs(), 100L), Integer.MAX_VALUE));

        return WebClient.builder()
                .baseUrl(baseUrl.isEmpty() ? "http://localhost:8000" : baseUrl)
                .clientConnector(new ReactorClientHttpConnector(reactorHttpClient))
                .build();
    }
}

package com.inventario.web.dto.ai;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Cuerpo público desde Angular (solo la pregunta). Identidad y tenant los completa Spring Boot.
 */
public record AIChatRequestDto(
        @NotBlank(message = "La pregunta es obligatoria")
        @Size(max = 1000, message = "La pregunta no puede superar los 1000 caracteres")
        String question
) {}

package com.inventario.web.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Payload para POST {@code /api/v1/ai/chat} del microservicio Python (campos snake_case).
 *
 * <p>Construido solo en servidor tras validar JWT y pertenencia al tenant.</p>
 */
public record AIServiceChatRequestDto(
        @JsonProperty("company_id") Long companyId,
        @JsonProperty("user_id") Long userId,
        String role,
        String question,
        AIContextDto context
) {}

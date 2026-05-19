package com.inventario.web.controller;

import com.inventario.service.ai.AIApplicationService;
import com.inventario.web.dto.ai.AIChatRequestDto;
import com.inventario.web.dto.ai.AIChatResponseDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Proxy seguro hacia el microservicio Python de IA.
 *
 * <p>Angular debe usar solo esta ruta; nunca llamar directamente al puerto 8000 desde el navegador.</p>
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
@Tag(name = "AI assistant", description = "Asistente de inventario (integración servidor a servidor con FastAPI)")
public class AIController {

    private final AIApplicationService aiApplicationService;

    @PostMapping("/chat")
    @PreAuthorize(
            "hasAnyAuthority('ADMIN','SUPER_ADMIN','GERENCIA','COMPRAS','AUX_BODEGA')")
    @Operation(summary = "Pregunta al asistente de inventario (contexto enriquecido en servidor)")
    public AIChatResponseDto chat(@Valid @RequestBody AIChatRequestDto body) {
        return aiApplicationService.chat(body);
    }
}

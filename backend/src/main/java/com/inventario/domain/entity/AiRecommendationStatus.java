package com.inventario.domain.entity;

/**
 * Ciclo de vida de una recomendación generada tras un turno de chat con el asistente IA.
 * Las transiciones válidas están aplicadas en {@code AiRecommendationLifecycleService}.
 */
public enum AiRecommendationStatus {
    PENDING,
    ACCEPTED,
    DISMISSED,
    EXECUTED
}

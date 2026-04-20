package com.inventario.service.inventory;

import java.math.BigDecimal;

/** Contenido del correo de alerta de stock (mismo texto en envío real y en simulación). */
public record MailPedidoSugerido(String asunto, String cuerpo, BigDecimal cantidadSugerida) {}

package com.inventario.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTOs para perfil de empresa. Validación centralizada (email / teléfono) antes de persistir.
 */
public final class EmpresaMiDtos {

    private EmpresaMiDtos() {}

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmpresaMiUpdateRequest {
        public static final String TELEFONO_OPCIONAL = "^(|[+]?[0-9][0-9\\s()\\-]{6,38})$";

        @NotBlank
        @Size(max = 200)
        private String nombre;

        /** Opcional; cadena vacía o formato email RFC simplificado. */
        @Pattern(regexp = "^$|(?i)^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email de contacto inválido")
        @Size(max = 255)
        private String emailContacto;

        /** Opcional; dígitos, espacios, guiones, paréntesis y + inicial. */
        @Pattern(regexp = TELEFONO_OPCIONAL, message = "Teléfono inválido")
        @Size(max = 40)
        private String telefono;

        /**
         * Copia de alertas de pedido a proveedor. Vacío borra el valor (se usa {@link #emailContacto} como copia).
         * {@code null} en JSON = no modificar (compatibilidad con clientes antiguos).
         */
        @Pattern(regexp = "^$|(?i)^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message = "Email de notificaciones de inventario inválido")
        @Size(max = 255)
        private String emailNotificacionesInventario;

        /** {@code null} = no modificar. */
        private Boolean alertasPedidoProveedorActivas;

        /**
         * Tope de unidades por correo. {@code null} = no modificar; valor ≤ 0 borra el tope en base de datos.
         */
        private BigDecimal pedidoProveedorCantidadMaxima;
    }
}

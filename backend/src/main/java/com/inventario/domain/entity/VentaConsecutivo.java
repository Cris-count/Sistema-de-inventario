package com.inventario.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "venta_consecutivo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VentaConsecutivo {

    @Id
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;

    @Column(nullable = false)
    private Long ultimo;
}

package com.inventario.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InventarioId implements Serializable {

    @Column(name = "producto_id", nullable = false)
    private Long productoId;

    @Column(name = "bodega_id", nullable = false)
    private Long bodegaId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InventarioId that = (InventarioId) o;
        return Objects.equals(productoId, that.productoId) && Objects.equals(bodegaId, that.bodegaId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productoId, bodegaId);
    }
}

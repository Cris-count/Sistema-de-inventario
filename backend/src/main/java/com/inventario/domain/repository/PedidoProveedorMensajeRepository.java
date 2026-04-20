package com.inventario.domain.repository;

import com.inventario.domain.entity.PedidoProveedorMensaje;
import com.inventario.domain.entity.PedidoProveedorMensajeEstado;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PedidoProveedorMensajeRepository extends JpaRepository<PedidoProveedorMensaje, Long> {

    boolean existsByEmpresa_IdAndProducto_IdAndBodega_IdAndEstado(
            Long empresaId, Long productoId, Long bodegaId, PedidoProveedorMensajeEstado estado);

    Optional<PedidoProveedorMensaje> findByIdAndEmpresa_Id(Long id, Long empresaId);

    @EntityGraph(attributePaths = {"producto", "bodega", "proveedor", "resueltoPor"})
    Page<PedidoProveedorMensaje> findByEmpresa_IdOrderByCreadoEnDesc(Long empresaId, Pageable pageable);

    @EntityGraph(attributePaths = {"producto", "bodega", "proveedor", "resueltoPor"})
    Page<PedidoProveedorMensaje> findByEmpresa_IdAndEstadoOrderByCreadoEnDesc(
            Long empresaId, PedidoProveedorMensajeEstado estado, Pageable pageable);
}

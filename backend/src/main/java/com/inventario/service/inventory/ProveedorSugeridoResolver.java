package com.inventario.service.inventory;

import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Resuelve proveedor para reposición: preferido del producto; si no, último proveedor en una entrada que incluya el
 * producto. Misma prioridad que {@link PedidoProveedorMensajeService} (centralizado aquí para no duplicar).
 */
@Service
@RequiredArgsConstructor
public class ProveedorSugeridoResolver {

    public static final String FUENTE_PREFERIDO = "PREFERIDO";
    public static final String FUENTE_ULTIMA_ENTRADA = "ULTIMA_ENTRADA";

    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final MovimientoRepository movimientoRepository;

    public record Sugerencia(Proveedor proveedor, String fuenteCodigo) {}

    /**
     * @return vacío si no hay proveedor preferido activo ni historial de entrada con proveedor.
     */
    public Optional<Sugerencia> resolverConFuente(long empresaId, long productoId) {
        Long preferidoId = productoRepository.findProveedorPreferidoIdByIdAndEmpresa(productoId, empresaId);
        if (preferidoId != null) {
            Optional<Proveedor> pref =
                    proveedorRepository.findByIdAndEmpresaId(preferidoId, empresaId).filter(Proveedor::getActivo);
            if (pref.isPresent()) {
                return Optional.of(new Sugerencia(pref.get(), FUENTE_PREFERIDO));
            }
        }
        return movimientoRepository
                .findLatestProveedorIdEntradaProducto(empresaId, productoId)
                .flatMap(pid -> proveedorRepository.findByIdAndEmpresaId(pid, empresaId))
                .filter(Proveedor::getActivo)
                .map(p -> new Sugerencia(p, FUENTE_ULTIMA_ENTRADA));
    }
}

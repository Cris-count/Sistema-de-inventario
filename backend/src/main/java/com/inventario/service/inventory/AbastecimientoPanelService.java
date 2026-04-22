package com.inventario.service.inventory;

import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.AbastecimientoDtos.AbastecimientoPanelResponse;
import com.inventario.web.dto.AbastecimientoDtos.ProductoPorReponerDto;
import com.inventario.web.dto.AbastecimientoDtos.ResumenAbastecimientoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Panel operativo de reposición: líneas con {@code cantidad <= stockMinimo} (misma base que {@code /inventario/alertas}),
 * enriquecidas con proveedor sugerido y última entrada por producto/bodega.
 */
@Service
@RequiredArgsConstructor
public class AbastecimientoPanelService {

    private static final ZoneId ZONA_CO = ZoneId.of("America/Bogota");

    private final InventarioRepository inventarioRepository;
    private final MovimientoRepository movimientoRepository;
    private final ProveedorSugeridoResolver proveedorSugeridoResolver;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public AbastecimientoPanelResponse construirPanel(Long bodegaId, boolean puedeRegistrarEntrada) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);

        List<Inventario> lineas = inventarioRepository.findBajoMinimoPorEmpresa(empresaId, bodegaId);
        Instant inicioHoy = LocalDate.now(ZONA_CO).atStartOfDay(ZONA_CO).toInstant();
        long entradasHoy = movimientoRepository.countEntradasDesde(empresaId, TipoMovimiento.ENTRADA, inicioHoy);

        int sinStock = 0;
        int criticos = 0;
        int bajo = 0;
        List<ProductoPorReponerDto> productos = new ArrayList<>(lineas.size());
        for (Inventario inv : lineas) {
            var p = inv.getProducto();
            var b = inv.getBodega();
            BigDecimal cant = inv.getCantidad();
            BigDecimal min = p.getStockMinimo();
            String estado = clasificarEstado(cant, min);
            switch (estado) {
                case "SIN_STOCK" -> sinStock++;
                case "CRITICO" -> criticos++;
                case "BAJO" -> bajo++;
                default -> {
                    /* no debería ocurrir: la consulta ya filtra cantidad <= min */
                }
            }

            Optional<ProveedorSugeridoResolver.Sugerencia> sug =
                    proveedorSugeridoResolver.resolverConFuente(empresaId, p.getId());
            Long provId = sug.map(s -> s.proveedor().getId()).orElse(null);
            String provNombre = sug.map(s -> s.proveedor().getRazonSocial()).orElse(null);
            String fuente = sug.map(ProveedorSugeridoResolver.Sugerencia::fuenteCodigo).orElse(null);

            Instant ultimaEntrada = movimientoRepository
                    .findUltimaFechaEntradaProductoBodega(
                            empresaId, p.getId(), b.getId(), TipoMovimiento.ENTRADA)
                    .orElse(null);

            productos.add(
                    new ProductoPorReponerDto(
                            p.getId(),
                            p.getCodigo(),
                            p.getNombre(),
                            b.getId(),
                            b.getNombre(),
                            cant,
                            min,
                            estado,
                            provId,
                            provNombre,
                            fuente,
                            ultimaEntrada,
                            puedeRegistrarEntrada));
        }

        ResumenAbastecimientoDto resumen =
                new ResumenAbastecimientoDto(lineas.size(), sinStock, criticos, bajo, entradasHoy);
        return new AbastecimientoPanelResponse(resumen, productos);
    }

    /**
     * Solo aplica a líneas ya filtradas como bajo/atención ({@code cantidad <= min}, {@code min > 0}).
     * <ul>
     *   <li>SIN_STOCK: cantidad &lt;= 0
     *   <li>CRITICO: cantidad &gt; 0 y cantidad &lt;= mitad del mínimo
     *   <li>BAJO: resto (por encima de la mitad hasta el mínimo inclusive)
     * </ul>
     */
    static String clasificarEstado(BigDecimal cantidad, BigDecimal stockMinimo) {
        if (cantidad.compareTo(BigDecimal.ZERO) <= 0) {
            return "SIN_STOCK";
        }
        if (stockMinimo.compareTo(BigDecimal.ZERO) <= 0) {
            return "BAJO";
        }
        BigDecimal mitad = stockMinimo.multiply(new BigDecimal("0.5"));
        if (cantidad.compareTo(mitad) <= 0) {
            return "CRITICO";
        }
        return "BAJO";
    }
}

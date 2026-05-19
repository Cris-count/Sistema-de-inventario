package com.inventario.service.ai;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.EstadoMovimiento;
import com.inventario.domain.entity.Inventario;
import com.inventario.domain.entity.Movimiento;
import com.inventario.domain.entity.MovimientoDetalle;
import com.inventario.domain.entity.Producto;
import com.inventario.domain.entity.TipoMovimiento;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.domain.repository.MovimientoRepository;
import com.inventario.domain.repository.ProductoRepository;
import com.inventario.domain.repository.VentaRepository;
import com.inventario.domain.tenant.TenantSpecifications;
import com.inventario.web.dto.ai.AIContextDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Construye el contexto multiempresa sanitizado para el microservicio de IA (sin exponer entidades JPA ni cross-tenant).
 *
 * <p>Cada segmento tiene límites fijos y se aísla con try/catch: un fallo deja ese segmento vacío sin tumbar {@code POST /api/v1/ai/chat}.
 * Filtrado adicional opcional por rol (la autorización real sigue en {@code @PreAuthorize}).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIContextBuilder {

    static final int MAX_PRODUCTS_CONTEXT = 10;
    static final int MAX_STOCK_CONTEXT = 10;
    static final int MAX_SALES_CONTEXT = 10;
    static final int MAX_MOVEMENTS_CONTEXT = 10;
    /** Página de cabeceras de movimiento a inspeccionar antes de aplastar líneas (acotado). */
    private static final int MOVEMENT_HEADER_PAGE_SIZE = 24;

    private final ProductoRepository productoRepository;
    private final InventarioRepository inventarioRepository;
    private final VentaRepository ventaRepository;
    private final MovimientoRepository movimientoRepository;

    AIContextDto buildSanitizedContext(long empresaId, String rolCodigoCanonico) {
        ContextSections policy = visibilityForRole(rolCodigoCanonico);

        List<Map<String, Object>> products =
                policy.includeProducts ? safeProducts(empresaId) : List.of();
        List<Map<String, Object>> stock = policy.includeStock ? safeLowStockSlice(empresaId) : List.of();
        List<Map<String, Object>> sales =
                policy.includeSales ? safeTopSalesLast30Days(empresaId) : List.of();
        List<Map<String, Object>> movements =
                policy.includeMovements ? safeRecentMovementLines(empresaId) : List.of();

        log.info(
                "AI context ready empresaId={} role={} products={} stockRows={} salesRows={} movementRows={}",
                empresaId,
                rolCodigoCanonico,
                products.size(),
                stock.size(),
                sales.size(),
                movements.size());

        return new AIContextDto(products, stock, sales, movements);
    }

    /**
     * Heurística opcional sobre qué vectores incluir antes de llamar al microservicio. La autorización dura está en {@code @PreAuthorize}
     * y los datos siguen siendo siempre empresa_id del usuario autenticado.
     *
     * <ul>
     *   <li>ADMIN / SUPER_ADMIN / GERENCIA / COMPRAS: productos, stock, ventas (30 días) y movimientos.</li>
     *   <li>AUX_BODEGA: operación logística sin agregados de ventas.</li>
     * </ul>
     *
     * <p>TODO: filtrar movimientos de COMPRAS solo a ENTRADA/TRANSFERENCIA si se requiere “solo compras”. TODO: enlazar {@code PlanEntitlementService}.</p>
     */
    private static ContextSections visibilityForRole(String role) {
        return switch (role) {
            case SecurityRoles.SUPER_ADMIN, SecurityRoles.ADMIN, SecurityRoles.GERENCIA, SecurityRoles.COMPRAS ->
                    ContextSections.full();
            case SecurityRoles.AUX_BODEGA -> new ContextSections(true, true, false, true);
            default -> ContextSections.full();
        };
    }

    private List<Map<String, Object>> safeProducts(long empresaId) {
        try {
            return loadActiveProductSummaries(empresaId);
        } catch (Exception ex) {
            log.warn("AI context segment 'products' skipped empresaId={} reason={}", empresaId, ex.toString());
            return List.of();
        }
    }

    private List<Map<String, Object>> safeLowStockSlice(long empresaId) {
        try {
            return loadLowestStockSummaries(empresaId);
        } catch (Exception ex) {
            log.warn("AI context segment 'stock' skipped empresaId={} reason={}", empresaId, ex.toString());
            return List.of();
        }
    }

    private List<Map<String, Object>> safeTopSalesLast30Days(long empresaId) {
        try {
            return loadSalesSummaries(empresaId);
        } catch (Exception ex) {
            log.warn("AI context segment 'sales' skipped empresaId={} reason={}", empresaId, ex.toString());
            return List.of();
        }
    }

    private List<Map<String, Object>> safeRecentMovementLines(long empresaId) {
        try {
            return loadMovementSummaries(empresaId);
        } catch (Exception ex) {
            log.warn("AI context segment 'movements' skipped empresaId={} reason={}", empresaId, ex.toString());
            return List.of();
        }
    }

    /** Productos activos (tenant vía Specification + empresa en join implícito). */
    private List<Map<String, Object>> loadActiveProductSummaries(Long empresaId) {
        Specification<Producto> spec =
                TenantSpecifications.<Producto>belongsToEmpresa(empresaId)
                        .and((root, query, cb) -> cb.isTrue(root.get("activo")));
        var page =
                productoRepository.findAll(
                        spec,
                        PageRequest.of(0, MAX_PRODUCTS_CONTEXT, Sort.by(Sort.Direction.ASC, "id")));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Producto p : page.getContent()) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("name", p.getNombre());
            m.put("sku", p.getCodigo() != null ? p.getCodigo() : "");
            m.put(
                    "category",
                    p.getCategoria() != null && p.getCategoria().getNombre() != null
                            ? p.getCategoria().getNombre()
                            : "");
            m.put("active", Boolean.TRUE.equals(p.getActivo()));
            if (p.getCreatedAt() != null) {
                m.put("createdAt", p.getCreatedAt().toString());
            }
            rows.add(m);
        }
        return rows;
    }

    /**
     * Filas Inventario ordenadas por cantidad ascendente: prioriza las combinaciones producto×bodega con menos stock.
     * {@code empresaId} aplicado en repositorio.
     */
    private List<Map<String, Object>> loadLowestStockSummaries(Long empresaId) {
        var page =
                inventarioRepository.buscarPorEmpresa(
                        empresaId,
                        null,
                        null,
                        PageRequest.of(
                                0,
                                MAX_STOCK_CONTEXT,
                                Sort.by(Sort.Direction.ASC, "cantidad")));

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Inventario i : page.getContent()) {
            Producto p = i.getProducto();
            var b = i.getBodega();
            BigDecimal qty = i.getCantidad();
            BigDecimal min = p != null ? p.getStockMinimo() : null;

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", p != null ? p.getId() : null);
            m.put("productName", p != null ? p.getNombre() : "");
            m.put("currentStock", qty);
            m.put(
                    "warehouseName",
                    b != null && b.getNombre() != null ? b.getNombre() : "");
            m.put(
                    "minimumStock",
                    min != null ? min : BigDecimal.ZERO);
            m.put("riskLevel", classifyStockRisk(qty, min));
            rows.add(m);
        }
        return rows;
    }

    private static String classifyStockRisk(BigDecimal quantity, BigDecimal stockMinimo) {
        BigDecimal qty = quantity != null ? quantity : BigDecimal.ZERO;
        if (stockMinimo == null || stockMinimo.compareTo(BigDecimal.ZERO) <= 0) {
            return qty.compareTo(BigDecimal.ZERO) <= 0 ? "HIGH" : "LOW";
        }
        if (qty.compareTo(stockMinimo) <= 0) {
            return "HIGH";
        }
        BigDecimal moderateCeiling =
                stockMinimo.multiply(BigDecimal.valueOf(1.5)).setScale(4, RoundingMode.HALF_UP);
        if (qty.compareTo(moderateCeiling) <= 0) {
            return "MEDIUM";
        }
        return "LOW";
    }

    private List<Map<String, Object>> loadSalesSummaries(Long empresaId) {
        Instant hasta = Instant.now().plusMillis(1);
        Instant desde = Instant.now().minus(30, ChronoUnit.DAYS);
        List<Map<String, Object>> rows = new ArrayList<>();
        List<Object[]> raw =
                ventaRepository.findTopProductosPorCantidadVendidaEnRango(
                        empresaId, desde, hasta, MAX_SALES_CONTEXT);
        for (Object[] row : raw) {
            Long productId = ((Number) row[0]).longValue();
            String name = row[1] != null ? row[1].toString() : "";
            BigDecimal qty = coerceBigDecimal(row[2]);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", productId);
            m.put("productName", name);
            m.put("quantitySold", qty);
            m.put("period", "last_30_days");
            rows.add(m);
        }
        return rows;
    }

    private List<Map<String, Object>> loadMovementSummaries(Long empresaId) {
        Instant hasta = Instant.now().plusMillis(1);
        Instant desde = Instant.now().minus(90, ChronoUnit.DAYS);
        var page =
                movimientoRepository.findByEmpresaAndTipoAndFechaBetween(
                        empresaId,
                        null,
                        desde,
                        hasta,
                        PageRequest.of(
                                0,
                                MOVEMENT_HEADER_PAGE_SIZE,
                                Sort.by(Sort.Direction.DESC, "fechaMovimiento")));

        List<Map<String, Object>> rows = new ArrayList<>();
        outer:
        for (Movimiento mov : page.getContent()) {
            if (mov.getEstado() != EstadoMovimiento.COMPLETADO) {
                continue;
            }
            List<MovimientoDetalle> detalles = mov.getDetalles();
            if (detalles == null) {
                continue;
            }
            for (MovimientoDetalle d : detalles) {
                if (rows.size() >= MAX_MOVEMENTS_CONTEXT) {
                    break outer;
                }
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("movementId", mov.getId());
                m.put("type", mov.getTipoMovimiento().name());
                var prod = d.getProducto();
                m.put("productName", prod != null ? prod.getNombre() : "");
                m.put("quantity", d.getCantidad());
                m.put("warehouseName", warehouseLabel(mov.getTipoMovimiento(), d));
                m.put("createdAt", mov.getFechaMovimiento().toString());
                rows.add(m);
            }
        }
        return rows;
    }

    private static String warehouseLabel(TipoMovimiento tipo, MovimientoDetalle d) {
        return switch (tipo) {
            case ENTRADA -> nombreBodega(d.getBodegaDestino());
            case SALIDA, SALIDA_POR_VENTA -> nombreBodega(d.getBodegaOrigen());
            case TRANSFERENCIA -> {
                String o = nombreBodega(d.getBodegaOrigen());
                String dest = nombreBodega(d.getBodegaDestino());
                if (o.isEmpty() && dest.isEmpty()) {
                    yield "";
                }
                yield o + " → " + dest;
            }
            case AJUSTE -> {
                String dest = nombreBodega(d.getBodegaDestino());
                if (!dest.isEmpty()) {
                    yield dest;
                }
                yield nombreBodega(d.getBodegaOrigen());
            }
        };
    }

    private static String nombreBodega(com.inventario.domain.entity.Bodega b) {
        return b != null && b.getNombre() != null ? b.getNombre() : "";
    }

    private static BigDecimal coerceBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        return BigDecimal.ZERO;
    }

    private record ContextSections(
            boolean includeProducts, boolean includeStock, boolean includeSales, boolean includeMovements) {
        static ContextSections full() {
            return new ContextSections(true, true, true, true);
        }
    }
}

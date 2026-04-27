package com.inventario.service.catalog;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.*;
import com.inventario.domain.repository.VentaDetalleRepository;
import com.inventario.domain.repository.VentaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.MovimientoService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.VentaDtos.*;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class VentaService {

    private static final ZoneId ZONA_CO = ZoneId.of("America/Bogota");

    private final VentaRepository ventaRepository;
    private final VentaDetalleRepository ventaDetalleRepository;
    private final MovimientoService movimientoService;
    private final VentaConsecutivoService ventaConsecutivoService;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;
    private final VentaPreparacionService ventaPreparacionService;

    @Transactional(rollbackFor = Exception.class)
    public VentaCreatedResponse crear(VentaCreateRequest req) {
        Usuario usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.MOVIMIENTOS_BASICOS);

        var preparada = ventaPreparacionService.preparar(usuario, empresaId, req, false);
        String codigoPublico = ventaConsecutivoService.siguienteCodigoPublico(empresaId);

        Movimiento movimiento =
                movimientoService.registrarMovimientoSalidaPorVenta(
                        preparada.bodega().getId(),
                        ventaPreparacionService.lineasSalida(preparada),
                        preparada.observacion(),
                        codigoPublico);

        Instant ahora = Instant.now();
        Venta venta = new Venta();
        venta.setEmpresa(usuario.getEmpresa());
        venta.setBodega(preparada.bodega());
        venta.setUsuario(usuario);
        venta.setCliente(preparada.cliente());
        venta.setMovimiento(movimiento);
        venta.setCodigoPublico(codigoPublico);
        venta.setFechaVenta(ahora);
        venta.setTotal(preparada.total());
        venta.setEstado(VentaEstado.CONFIRMADA);
        venta.setObservacion(preparada.observacion());
        venta.setCreatedAt(ahora);

        ventaPreparacionService.agregarDetalles(venta, preparada);

        Venta guardada = ventaRepository.save(venta);

        return new VentaCreatedResponse(
                guardada.getId(),
                guardada.getCodigoPublico(),
                movimiento.getId(),
                guardada.getFechaVenta(),
                guardada.getTotal(),
                guardada.getEstado().name());
    }

    @Transactional(readOnly = true)
    public Page<VentaListItemResponse> listar(
            Pageable pageable,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long bodegaId,
            Long usuarioVendedorId,
            String estadoStr,
            Long clienteId,
            String codigoContiene) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Long usuarioObligatorioVentas = filtroUsuarioListadoId();

        Instant desde = null;
        Instant hastaExcl = null;
        if (fechaDesde != null) {
            desde = fechaDesde.atStartOfDay(ZONA_CO).toInstant();
        }
        if (fechaHasta != null) {
            hastaExcl = fechaHasta.plusDays(1).atStartOfDay(ZONA_CO).toInstant();
        }

        VentaEstado estado = null;
        if (estadoStr != null && !estadoStr.isBlank()) {
            try {
                estado = VentaEstado.valueOf(estadoStr.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Estado de venta inválido");
            }
        }

        String codigo = codigoContiene == null || codigoContiene.isBlank() ? null : codigoContiene.trim();

        Specification<Venta> spec = VentaSpecifications.filtrar(
                empresaId,
                usuarioObligatorioVentas,
                desde,
                hastaExcl,
                bodegaId,
                usuarioObligatorioVentas != null ? null : usuarioVendedorId,
                estado,
                clienteId,
                codigo);

        return ventaRepository.findAll(spec, pageable).map(this::toListItem);
    }

    @Transactional(rollbackFor = Exception.class)
    public void anular(Long ventaId) {
        Usuario usuario = currentUserService.requireUsuario();
        String rol = SecurityRoles.canonicalCodigo(usuario.getRol().getCodigo());
        if (!SecurityRoles.ADMIN.equals(rol) && !SecurityRoles.SUPER_ADMIN.equals(rol)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Solo administradores pueden anular ventas");
        }
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.MOVIMIENTOS_BASICOS);
        Venta v = ventaRepository
                .findByIdAndEmpresa_Id(ventaId, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada"));
        if (v.getEstado() != VentaEstado.CONFIRMADA) {
            throw new BusinessException(HttpStatus.CONFLICT, "Solo se pueden anular ventas confirmadas");
        }
        movimientoService.anularMovimientoSalidaPorVenta(v.getMovimiento().getId(), empresaId);
        v.setEstado(VentaEstado.ANULADA);
        ventaRepository.save(v);
    }

    @Transactional(readOnly = true)
    public VentaDetailResponse obtener(Long id) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Venta v = ventaRepository
                .findByIdAndEmpresa_Id(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada"));
        assertPuedeVerVenta(v);
        return toDetail(v);
    }

    @Transactional(readOnly = true)
    public VentaOperativoResumenResponse resumenOperativo(LocalDate fechaDesde, LocalDate fechaHasta) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Long usuarioFiltro = filtroUsuarioListadoId();

        LocalDate hasta = fechaHasta != null ? fechaHasta : LocalDate.now(ZONA_CO);
        LocalDate desde = fechaDesde != null ? fechaDesde : hasta.minusDays(6);
        if (desde.isAfter(hasta)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La fecha desde no puede ser posterior a la fecha hasta");
        }

        Instant iDesde = desde.atStartOfDay(ZONA_CO).toInstant();
        Instant iHastaExcl = hasta.plusDays(1).atStartOfDay(ZONA_CO).toInstant();

        long confirmadas =
                ventaRepository.countEnRangoFecha(empresaId, iDesde, iHastaExcl, usuarioFiltro);
        BigDecimal totalConfirmado =
                ventaRepository.sumTotalesEnRangoFecha(empresaId, iDesde, iHastaExcl, usuarioFiltro);
        BigDecimal unidades =
                ventaRepository.sumUnidadesVendidasEnRangoFecha(empresaId, iDesde, iHastaExcl, usuarioFiltro);
        long anuladas = ventaRepository.countAnuladasEnRangoFecha(empresaId, iDesde, iHastaExcl, usuarioFiltro);
        BigDecimal montoAnuladas =
                ventaRepository.sumTotalesAnuladasEnRangoFecha(empresaId, iDesde, iHastaExcl, usuarioFiltro);

        var topRaw =
                ventaDetalleRepository.topProductosPorCantidad(
                        empresaId, iDesde, iHastaExcl, usuarioFiltro, PageRequest.of(0, 15));
        List<VentaProductoRankingItem> top = new ArrayList<>();
        for (Object[] row : topRaw) {
            top.add(
                    new VentaProductoRankingItem(
                            (Long) row[0],
                            (String) row[1],
                            (String) row[2],
                            (BigDecimal) row[3],
                            (BigDecimal) row[4]));
        }

        List<VentaVendedorBucketItem> porVendedor = new ArrayList<>();
        for (Object[] row : ventaRepository.resumenPorVendedor(empresaId, iDesde, iHastaExcl, usuarioFiltro)) {
            porVendedor.add(
                    new VentaVendedorBucketItem(
                            (Long) row[0],
                            (String) row[1],
                            ((Number) row[2]).longValue(),
                            (BigDecimal) row[3]));
        }

        List<VentaBodegaBucketItem> porBodega = new ArrayList<>();
        for (Object[] row : ventaRepository.resumenPorBodega(empresaId, iDesde, iHastaExcl, usuarioFiltro)) {
            porBodega.add(
                    new VentaBodegaBucketItem(
                            (Long) row[0],
                            (String) row[1],
                            ((Number) row[2]).longValue(),
                            (BigDecimal) row[3]));
        }

        return new VentaOperativoResumenResponse(
                desde,
                hasta,
                confirmadas,
                totalConfirmado != null ? totalConfirmado : BigDecimal.ZERO,
                unidades != null ? unidades : BigDecimal.ZERO,
                anuladas,
                montoAnuladas != null ? montoAnuladas : BigDecimal.ZERO,
                top,
                porVendedor,
                porBodega);
    }

    @Transactional(readOnly = true)
    public byte[] exportarCsv(LocalDate fechaDesde, LocalDate fechaHasta) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Long usuarioFiltro = filtroUsuarioListadoId();

        LocalDate hasta = fechaHasta != null ? fechaHasta : LocalDate.now(ZONA_CO);
        LocalDate desde = fechaDesde != null ? fechaDesde : hasta.minusDays(6);
        if (desde.isAfter(hasta)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "La fecha desde no puede ser posterior a la fecha hasta");
        }

        Instant iDesde = desde.atStartOfDay(ZONA_CO).toInstant();
        Instant iHastaExcl = hasta.plusDays(1).atStartOfDay(ZONA_CO).toInstant();

        List<Venta> filas = ventaRepository.findAllParaExport(empresaId, iDesde, iHastaExcl, usuarioFiltro);
        StringBuilder sb =
                new StringBuilder(
                        "codigoPublico,id,fechaVenta,estado,interpretacionOperativa,pagoEstado,aclaracionPago,bodega,vendedor,cliente,total,movimientoId,movimientoEstado\n");
        for (Venta v : filas) {
            sb.append(csvField(v.getCodigoPublico()))
                    .append(',')
                    .append(v.getId())
                    .append(',')
                    .append(v.getFechaVenta())
                    .append(',')
                    .append(csvField(v.getEstado().name()))
                    .append(',')
                    .append(csvField(interpretacionOperativa(v)))
                    .append(',')
                    .append(csvField(v.getPagoEstado() != null ? v.getPagoEstado().name() : null))
                    .append(',')
                    .append(csvField(aclaracionPago(v)))
                    .append(',')
                    .append(csvField(v.getBodega().getNombre()))
                    .append(',')
                    .append(csvField(v.getUsuario().getEmail()))
                    .append(',')
                    .append(csvField(v.getCliente() != null ? v.getCliente().getNombre() : null))
                    .append(',')
                    .append(v.getTotal())
                    .append(',')
                    .append(v.getMovimiento() != null ? v.getMovimiento().getId() : "")
                    .append(',')
                    .append(csvField(v.getMovimiento() != null ? v.getMovimiento().getEstado().name() : null))
                    .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static String csvField(String s) {
        if (s == null) {
            return "\"\"";
        }
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    private static String interpretacionOperativa(Venta v) {
        if (v.getEstado() == VentaEstado.ANULACION_SOLICITADA) {
            return "Anulación solicitada; pendiente revisión admin; stock aún no revertido";
        }
        if (v.getEstado() == VentaEstado.ANULADA) {
            return "Anulada operativamente; stock revertido";
        }
        if (v.getEstado() == VentaEstado.PENDIENTE_PAGO) {
            return "Pendiente de pago; sin movimiento de inventario";
        }
        if (v.getEstado() == VentaEstado.CANCELADA_SIN_PAGO) {
            return "Cancelada sin pago; sin movimiento de inventario";
        }
        return "Confirmada; stock aplicado";
    }

    private static String aclaracionPago(Venta v) {
        if (v.getEstado() == VentaEstado.ANULADA && v.getPagoEstado() == VentaPagoEstado.STRIPE_SUCCEEDED) {
            return "Pago Stripe registrado; la anulación operativa no confirma reembolso";
        }
        if (v.getPagoEstado() == VentaPagoEstado.STRIPE_SUCCEEDED) {
            return "Pago Stripe confirmado";
        }
        return null;
    }

    @Transactional(readOnly = true)
    public VentaPanelResumenResponse resumenPanel() {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        Long usuarioFiltro = filtroUsuarioListadoId();

        LocalDate hoy = LocalDate.now(ZONA_CO);
        Instant inicioHoy = hoy.atStartOfDay(ZONA_CO).toInstant();
        Instant finHoy = hoy.plusDays(1).atStartOfDay(ZONA_CO).toInstant();

        long ventasHoy = ventaRepository.countEnRangoFecha(empresaId, inicioHoy, finHoy, usuarioFiltro);
        BigDecimal unidadesHoy = ventaRepository.sumUnidadesVendidasEnRangoFecha(empresaId, inicioHoy, finHoy, usuarioFiltro);
        BigDecimal totalHoy = ventaRepository.sumTotalesEnRangoFecha(empresaId, inicioHoy, finHoy, usuarioFiltro);

        LocalDate hace7 = hoy.minusDays(7);
        Instant inicio7 = hace7.atStartOfDay(ZONA_CO).toInstant();
        Instant finManana = hoy.plusDays(1).atStartOfDay(ZONA_CO).toInstant();
        long ventas7d = ventaRepository.countEnRangoFecha(empresaId, inicio7, finManana, usuarioFiltro);

        return new VentaPanelResumenResponse(
                ventasHoy,
                unidadesHoy != null ? unidadesHoy : BigDecimal.ZERO,
                totalHoy != null ? totalHoy : BigDecimal.ZERO,
                ventas7d);
    }

    private VentaListItemResponse toListItem(Venta v) {
        Long cid = v.getCliente() != null ? v.getCliente().getId() : null;
        String cnombre = v.getCliente() != null ? v.getCliente().getNombre() : null;
        Long mid = v.getMovimiento() != null ? v.getMovimiento().getId() : null;
        String pago = v.getPagoEstado() != null ? v.getPagoEstado().name() : null;
        return new VentaListItemResponse(
                v.getId(),
                v.getCodigoPublico(),
                v.getFechaVenta(),
                v.getBodega().getId(),
                v.getBodega().getNombre(),
                v.getTotal(),
                v.getDetalles().size(),
                v.getUsuario().getId(),
                v.getUsuario().getEmail(),
                mid,
                v.getEstado().name(),
                cid,
                cnombre,
                pago);
    }

    private VentaDetailResponse toDetail(Venta v) {
        List<VentaDetalleLineResponse> lineas = v.getDetalles().stream()
                .map(
                        d -> new VentaDetalleLineResponse(
                                d.getId(),
                                d.getProducto().getId(),
                                d.getProducto().getCodigo(),
                                d.getProducto().getNombre(),
                                d.getCantidad(),
                                d.getPrecioUnitario(),
                                d.getSubtotal()))
                .toList();
        Long cid = v.getCliente() != null ? v.getCliente().getId() : null;
        String cnombre = v.getCliente() != null ? v.getCliente().getNombre() : null;
        String cdoc = v.getCliente() != null ? v.getCliente().getDocumento() : null;
        String ctel = v.getCliente() != null ? v.getCliente().getTelefono() : null;
        Long mid = v.getMovimiento() != null ? v.getMovimiento().getId() : null;
        String mest = v.getMovimiento() != null ? v.getMovimiento().getEstado().name() : null;
        String pago = v.getPagoEstado() != null ? v.getPagoEstado().name() : null;
        String empresaNombre = v.getEmpresa() != null ? v.getEmpresa().getNombre() : null;
        return new VentaDetailResponse(
                v.getId(),
                v.getCodigoPublico(),
                v.getFechaVenta(),
                v.getBodega().getId(),
                v.getBodega().getNombre(),
                v.getTotal(),
                v.getEstado().name(),
                v.getObservacion(),
                v.getUsuario().getId(),
                v.getUsuario().getEmail(),
                formatoNombreVendedor(v.getUsuario()),
                mid,
                mest,
                cid,
                cnombre,
                cdoc,
                ctel,
                lineas,
                pago,
                v.getPaidAt(),
                v.getStripeCheckoutSessionId(),
                empresaNombre,
                metodoPagoEtiqueta(v));
    }

    private static String formatoNombreVendedor(Usuario u) {
        if (u == null) {
            return null;
        }
        String nom = u.getNombre() != null ? u.getNombre().trim() : "";
        String ap = u.getApellido() != null ? u.getApellido().trim() : "";
        if (!nom.isEmpty() && !ap.isEmpty()) {
            return nom + " " + ap;
        }
        if (!nom.isEmpty()) {
            return nom;
        }
        if (!ap.isEmpty()) {
            return ap;
        }
        return u.getEmail();
    }

    /** Etiqueta breve para comprobantes; no es facturación electrónica. */
    private static String metodoPagoEtiqueta(Venta v) {
        if (v.getEstado() != VentaEstado.CONFIRMADA) {
            return null;
        }
        VentaPagoEstado pe = v.getPagoEstado();
        if (pe == VentaPagoEstado.STRIPE_SUCCEEDED) {
            return "Tarjeta (Stripe)";
        }
        if (pe == null) {
            return "Punto de venta";
        }
        return null;
    }

    private void assertPuedeVerVenta(Venta v) {
        if (!filtroSoloVentasPropias()) {
            return;
        }
        Long uid = currentUserService.requireUsuario().getId();
        if (!v.getUsuario().getId().equals(uid)) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Venta no encontrada");
        }
    }

    private Long filtroUsuarioListadoId() {
        return filtroSoloVentasPropias() ? currentUserService.requireUsuario().getId() : null;
    }

    private boolean filtroSoloVentasPropias() {
        Usuario u = currentUserService.requireUsuario();
        return SecurityRoles.VENTAS.equals(SecurityRoles.canonicalCodigo(u.getRol().getCodigo()));
    }

}

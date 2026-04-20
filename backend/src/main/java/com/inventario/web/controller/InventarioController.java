package com.inventario.web.controller;

import com.inventario.domain.entity.Inventario;
import com.inventario.service.MovimientoService;
import com.inventario.service.catalog.InventarioQueryService;
import com.inventario.service.inventory.PedidoProveedorMensajeService;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.MovimientoDtos.MovimientoResponse;
import com.inventario.web.dto.MovimientoDtos.StockInicialRequest;
import com.inventario.web.dto.SimularCorreoStockDtos.SimularCorreoStockRequest;
import com.inventario.web.dto.SimularCorreoStockDtos.SimularCorreoStockResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class InventarioController {

    private final InventarioQueryService inventarioQueryService;
    private final MovimientoService movimientoService;
    private final PedidoProveedorMensajeService pedidoProveedorMensajeService;
    private final CurrentUserService currentUserService;
    private final PlanEntitlementService planEntitlementService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Consulta de existencias")
    public Page<Inventario> listar(
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) Long bodegaId,
            Pageable pageable) {
        return inventarioQueryService.buscar(productoId, bodegaId, pageable);
    }

    @GetMapping("/alertas")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(summary = "Productos bajo stock mínimo")
    public List<Inventario> alertas(@RequestParam(required = false) Long bodegaId) {
        return inventarioQueryService.alertas(bodegaId);
    }

    @PostMapping("/alertas/simular-correo")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN','AUX_BODEGA','COMPRAS','GERENCIA')")
    @Operation(
            summary = "Registrar solicitud de pedido (antes «simular correo»)",
            description =
                    "Crea un mensaje en la bandeja de administradores. Tras aprobar en «Mensajes pedido», se envía el correo al proveedor "
                            + "vinculado (preferido o última entrada COMPRA).")
    public SimularCorreoStockResponse simularCorreoStock(@Valid @RequestBody SimularCorreoStockRequest req) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        return pedidoProveedorMensajeService.simularSolicitud(empresaId, req.productoId(), req.bodegaId());
    }

    @PostMapping("/stock-inicial")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Carga de stock inicial")
    public MovimientoResponse stockInicial(@Valid @RequestBody StockInicialRequest req) {
        return movimientoService.stockInicial(req);
    }
}

package com.inventario.web.controller;

import com.inventario.domain.entity.PedidoProveedorMensajeEstado;
import com.inventario.service.CurrentUserService;
import com.inventario.service.inventory.PedidoProveedorMensajeService;
import com.inventario.web.dto.PedidoProveedorMensajeDtos.AprobarPedidoProveedorRequest;
import com.inventario.web.dto.PedidoProveedorMensajeDtos.PedidoProveedorMensajeResponse;
import com.inventario.web.dto.PedidoProveedorMensajeDtos.RechazarPedidoProveedorRequest;
import com.inventario.web.dto.PedidoProveedorMensajeDtos.ResolverPedidoProveedorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/mensajes-pedido")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class PedidoProveedorMensajeController {

    private final PedidoProveedorMensajeService mensajeService;
    private final CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Bandeja de solicitudes de pedido a proveedor (pendientes e histórico)")
    public Page<PedidoProveedorMensajeResponse> listar(
            @RequestParam(required = false) PedidoProveedorMensajeEstado estado, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        return mensajeService.listar(empresaId, estado, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Detalle de una solicitud")
    public PedidoProveedorMensajeResponse obtener(@PathVariable Long id) {
        Long empresaId = currentUserService.requireEmpresaId();
        return mensajeService.obtener(id, empresaId);
    }

    @PostMapping("/{id}/aprobar")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Aprueba y envía el correo al proveedor con la cantidad indicada")
    public ResolverPedidoProveedorResponse aprobar(
            @PathVariable Long id, @Valid @RequestBody AprobarPedidoProveedorRequest req) {
        return mensajeService.aprobar(id, req);
    }

    @PostMapping("/{id}/rechazar")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Rechaza la solicitud; no se envía correo al proveedor")
    public ResolverPedidoProveedorResponse rechazar(
            @PathVariable Long id, @Valid @RequestBody(required = false) RechazarPedidoProveedorRequest req) {
        return mensajeService.rechazar(id, req != null ? req : new RechazarPedidoProveedorRequest(null));
    }
}

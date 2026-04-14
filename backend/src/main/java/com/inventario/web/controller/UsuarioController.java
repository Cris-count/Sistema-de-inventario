package com.inventario.web.controller;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Usuario;
import com.inventario.service.catalog.UsuarioManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class UsuarioController {

    private final UsuarioManagementService usuarioManagementService;

    public record UsuarioCreateRequest(
            @Email @NotBlank String email,
            @NotBlank String password,
            @NotBlank String nombre,
            String apellido,
            @NotBlank String rolCodigo
    ) {}

    public record UsuarioUpdateRequest(
            String nombre,
            String apellido,
            String rolCodigo
    ) {}

    public record EstadoRequest(boolean activo) {}

    public record UsuarioResponse(Long id, String email, String nombre, String apellido, String rolCodigo, boolean activo) {}

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Listar usuarios")
    public Page<UsuarioResponse> listar(Pageable pageable) {
        return usuarioManagementService.listar(pageable).map(this::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Detalle usuario")
    public UsuarioResponse get(@PathVariable Long id) {
        return toResponse(usuarioManagementService.obtener(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear usuario")
    public UsuarioResponse crear(@Valid @RequestBody UsuarioCreateRequest req) {
        return toResponse(usuarioManagementService.crear(
                req.email(), req.password(), req.nombre(), req.apellido(), req.rolCodigo()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar usuario (sin contraseña aquí)")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req) {
        return toResponse(usuarioManagementService.actualizar(id, req.nombre(), req.apellido(), req.rolCodigo()));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Activar/desactivar usuario")
    public UsuarioResponse estado(@PathVariable Long id, @Valid @RequestBody EstadoRequest req) {
        return toResponse(usuarioManagementService.cambiarEstado(id, req.activo()));
    }

    private UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(
                u.getId(),
                u.getEmail(),
                u.getNombre(),
                u.getApellido(),
                SecurityRoles.canonicalCodigo(u.getRol().getCodigo()),
                u.getActivo()
        );
    }
}

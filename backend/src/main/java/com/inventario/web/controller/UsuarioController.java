package com.inventario.web.controller;

import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

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
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Listar usuarios")
    public Page<UsuarioResponse> listar(Pageable pageable) {
        return usuarioRepository.findAll(pageable).map(this::toResponse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Detalle usuario")
    public UsuarioResponse get(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(this::toResponse).orElseThrow();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crear usuario")
    public UsuarioResponse crear(@Valid @RequestBody UsuarioCreateRequest req) {
        if (usuarioRepository.existsByEmail(req.email())) {
            throw new com.inventario.web.error.BusinessException(org.springframework.http.HttpStatus.CONFLICT, "Email ya registrado");
        }
        Rol rol = rolRepository.findByCodigo(req.rolCodigo()).orElseThrow();
        Usuario u = new Usuario();
        u.setEmail(req.email());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setNombre(req.nombre());
        u.setApellido(req.apellido());
        u.setRol(rol);
        u.setActivo(true);
        u.setCreatedAt(Instant.now());
        return toResponse(usuarioRepository.save(u));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Actualizar usuario (sin contraseña aquí)")
    public UsuarioResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        if (req.nombre() != null) u.setNombre(req.nombre());
        if (req.apellido() != null) u.setApellido(req.apellido());
        if (req.rolCodigo() != null) {
            u.setRol(rolRepository.findByCodigo(req.rolCodigo()).orElseThrow());
        }
        u.setUpdatedAt(Instant.now());
        return toResponse(usuarioRepository.save(u));
    }

    @PatchMapping("/{id}/estado")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Operation(summary = "Activar/desactivar usuario")
    public UsuarioResponse estado(@PathVariable Long id, @Valid @RequestBody EstadoRequest req) {
        Usuario u = usuarioRepository.findById(id).orElseThrow();
        u.setActivo(req.activo());
        u.setUpdatedAt(Instant.now());
        return toResponse(usuarioRepository.save(u));
    }

    private UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(
                u.getId(),
                u.getEmail(),
                u.getNombre(),
                u.getApellido(),
                u.getRol().getCodigo(),
                u.getActivo()
        );
    }
}

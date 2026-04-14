package com.inventario.service.catalog;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UsuarioManagementService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;

    @Transactional(readOnly = true)
    public Page<Usuario> listar(Pageable pageable) {
        return usuarioRepository.findByEmpresaId(currentUserService.requireEmpresaId(), pageable);
    }

    @Transactional(readOnly = true)
    public Usuario obtener(Long id) {
        return tenantEntityLoader.requireUsuarioInTenant(id, currentUserService.requireEmpresaId());
    }

    @Transactional
    public Usuario crear(String email, String password, String nombre, String apellido, String rolCodigo) {
        Usuario actor = currentUserService.requireUsuario();
        assertPuedeAsignarRol(rolCodigo, actor);
        String emailNorm = email.trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByEmailIgnoreCase(emailNorm)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email ya registrado");
        }
        Rol rol = rolRepository.findByCodigo(SecurityRoles.canonicalCodigo(rolCodigo)).orElseThrow();
        Usuario u = new Usuario();
        u.setEmpresa(actor.getEmpresa());
        u.setEmail(emailNorm);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setNombre(nombre);
        u.setApellido(apellido);
        u.setRol(rol);
        u.setActivo(true);
        u.setCreatedAt(Instant.now());
        return usuarioRepository.save(u);
    }

    @Transactional
    public Usuario actualizar(Long id, String nombre, String apellido, String rolCodigo) {
        Usuario actor = currentUserService.requireUsuario();
        Long empresaId = actor.getEmpresa().getId();
        Usuario u = tenantEntityLoader.requireUsuarioInTenant(id, empresaId);
        if (nombre != null) {
            u.setNombre(nombre);
        }
        if (apellido != null) {
            u.setApellido(apellido);
        }
        if (rolCodigo != null) {
            assertPuedeAsignarRol(rolCodigo, actor);
            u.setRol(rolRepository.findByCodigo(SecurityRoles.canonicalCodigo(rolCodigo)).orElseThrow());
        }
        u.setUpdatedAt(Instant.now());
        return usuarioRepository.save(u);
    }

    @Transactional
    public Usuario cambiarEstado(Long id, boolean activo) {
        Long empresaId = currentUserService.requireEmpresaId();
        Usuario u = tenantEntityLoader.requireUsuarioInTenant(id, empresaId);
        u.setActivo(activo);
        u.setUpdatedAt(Instant.now());
        return usuarioRepository.save(u);
    }

    private static void assertPuedeAsignarRol(String rolCodigoSolicitado, Usuario actor) {
        String solicitado = SecurityRoles.canonicalCodigo(rolCodigoSolicitado);
        String actorRol = SecurityRoles.canonicalCodigo(actor.getRol().getCodigo());
        if (SecurityRoles.SUPER_ADMIN.equals(solicitado) && !SecurityRoles.SUPER_ADMIN.equals(actorRol)) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Solo SUPER_ADMIN puede asignar el rol SUPER_ADMIN");
        }
    }
}

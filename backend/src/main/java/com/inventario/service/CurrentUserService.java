package com.inventario.service;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UsuarioRepository usuarioRepository;

    public Usuario requireUsuario() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return usuarioRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    public Long requireEmpresaId() {
        Empresa e = requireEmpresa();
        return e.getId();
    }

    public Empresa requireEmpresa() {
        Usuario u = requireUsuario();
        Empresa e = u.getEmpresa();
        if (e == null) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Usuario sin empresa asignada");
        }
        if (e.getEstado() != EstadoEmpresa.ACTIVA) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Empresa inactiva");
        }
        return e;
    }
}

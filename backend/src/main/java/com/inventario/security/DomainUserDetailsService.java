package com.inventario.security;

import com.inventario.config.SecurityRoles;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DomainUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var u = usuarioRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException(email));
        boolean empresaBloquea = u.getEmpresa() == null || u.getEmpresa().getEstado() != EstadoEmpresa.ACTIVA;
        return User.builder()
                .username(u.getEmail())
                .password(u.getPasswordHash())
                .authorities(SecurityRoles.canonicalCodigo(u.getRol().getCodigo()))
                .disabled(!u.getActivo() || empresaBloquea)
                .build();
    }
}

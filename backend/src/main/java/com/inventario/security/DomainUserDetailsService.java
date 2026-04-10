package com.inventario.security;

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
        var u = usuarioRepository.findByEmail(email).orElseThrow(() -> new UsernameNotFoundException(email));
        return User.builder()
                .username(u.getEmail())
                .password(u.getPasswordHash())
                .authorities(u.getRol().getCodigo())
                .disabled(!u.getActivo())
                .build();
    }
}

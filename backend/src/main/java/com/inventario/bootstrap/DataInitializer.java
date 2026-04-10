package com.inventario.bootstrap;

import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() > 0) {
            return;
        }
        var rol = rolRepository.findByCodigo("ADMIN").orElseThrow(() ->
                new IllegalStateException("Rol ADMIN no existe. Ejecutar database/schema.sql"));
        Usuario admin = new Usuario();
        admin.setEmail(adminEmail);
        admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        admin.setNombre("Administrador");
        admin.setApellido("Sistema");
        admin.setRol(rol);
        admin.setActivo(true);
        admin.setCreatedAt(Instant.now());
        usuarioRepository.save(admin);
    }
}

package com.inventario.bootstrap;

import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;

/**
 * Crea usuarios semilla por <strong>email</strong> si aún no existen (no depende de que la tabla esté vacía).
 * Contraseñas solo vía {@link PasswordEncoder} (BCrypt), nunca en SQL manual sin hash real.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    /**
     * Si {@code APP_SEED_*_EMAIL} o contraseña vienen como cadena vacía desde el entorno,
     * Spring puede resolver el placeholder a "" y el usuario semilla no se crea. Estos fallbacks
     * coinciden con los valores por defecto de {@code application.yml} / {@code docker-compose.yml}.
     */
    private static final String DEF_AUX_EMAIL = "aux@inventario.local";
    private static final String DEF_AUX_PASSWORD = "AuxBodega123!";
    private static final String DEF_COMPRAS_EMAIL = "compras@inventario.local";
    private static final String DEF_COMPRAS_PASSWORD = "Compras123!";
    private static final String DEF_GERENCIA_EMAIL = "gerencia@inventario.local";
    private static final String DEF_GERENCIA_PASSWORD = "Gerencia123!";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email}")
    private String adminEmail;

    @Value("${app.seed.admin-password}")
    private String adminPassword;

    @Value("${app.seed.aux-email:}")
    private String auxEmail;

    @Value("${app.seed.aux-password:}")
    private String auxPassword;

    @Value("${app.seed.compras-email:}")
    private String comprasEmail;

    @Value("${app.seed.compras-password:}")
    private String comprasPassword;

    @Value("${app.seed.gerencia-email:}")
    private String gerenciaEmail;

    @Value("${app.seed.gerencia-password:}")
    private String gerenciaPassword;

    @Override
    public void run(String... args) {
        ensureUser(adminEmail, adminPassword, "Administrador", "Sistema", "ADMIN");
        ensureUser(orDefaultEmail(auxEmail, DEF_AUX_EMAIL), orDefaultPassword(auxPassword, DEF_AUX_PASSWORD), "Auxiliar", "Bodega", "AUX_BODEGA");
        ensureUser(orDefaultEmail(comprasEmail, DEF_COMPRAS_EMAIL), orDefaultPassword(comprasPassword, DEF_COMPRAS_PASSWORD), "Compras", "Demo", "COMPRAS");
        ensureUser(orDefaultEmail(gerenciaEmail, DEF_GERENCIA_EMAIL), orDefaultPassword(gerenciaPassword, DEF_GERENCIA_PASSWORD), "Gerencia", "Demo", "GERENCIA");
    }

    private static String orDefaultEmail(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private static String orDefaultPassword(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private void ensureUser(String email, String password, String nombre, String apellido, String rolCodigo) {
        String e = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (e.isEmpty()) {
            return;
        }
        if (password == null || password.isBlank()) {
            log.warn("Semilla omitida para {}: contraseña vacía (defina app.seed.*-password o variable de entorno).", e);
            return;
        }
        if (usuarioRepository.existsByEmailIgnoreCase(e)) {
            log.debug("Usuario ya existe, no se crea: {}", e);
            return;
        }
        var rol = rolRepository.findByCodigo(rolCodigo).orElseThrow(() ->
                new IllegalStateException(
                        "Rol " + rolCodigo + " no existe. Ejecutar database/schema.sql o la sección de roles de database/dev_verify_and_seed.sql"));
        Usuario u = new Usuario();
        u.setEmail(e);
        u.setPasswordHash(passwordEncoder.encode(password.trim()));
        u.setNombre(nombre);
        u.setApellido(apellido);
        u.setRol(rol);
        u.setActivo(true);
        u.setCreatedAt(Instant.now());
        usuarioRepository.save(u);
        log.info("Usuario semilla creado: {} ({})", e, rolCodigo);
    }
}

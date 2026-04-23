package com.inventario.bootstrap;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.SaasPlanRepository;
import com.inventario.domain.repository.UsuarioRepository;
import com.inventario.service.saas.SaasPlanPublicCatalog;
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
 * <p>
 * Multi-empresa: todos los usuarios semilla se asocian a la empresa indicada por {@code app.seed.empresa-identificacion}
 * (por defecto coincide con la fila {@code DEV-DEFAULT-001} de {@code database/schema.sql} / migración 002).
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final String DEF_AUX_EMAIL = "aux@inventario.local";
    private static final String DEF_AUX_PASSWORD = "AuxBodega123!";
    private static final String DEF_COMPRAS_EMAIL = "compras@inventario.local";
    private static final String DEF_COMPRAS_PASSWORD = "Compras123!";
    private static final String DEF_GERENCIA_EMAIL = "gerencia@inventario.local";
    private static final String DEF_GERENCIA_PASSWORD = "Gerencia123!";
    private static final String DEF_VENTAS_EMAIL = "ventas@inventario.local";
    private static final String DEF_VENTAS_PASSWORD = "Ventas123!";

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final EmpresaRepository empresaRepository;
    private final SaasPlanRepository saasPlanRepository;
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

    @Value("${app.seed.ventas-email:}")
    private String ventasEmail;

    @Value("${app.seed.ventas-password:}")
    private String ventasPassword;

    @Value("${app.seed.empresa-identificacion:DEV-DEFAULT-001}")
    private String empresaIdentificacion;

    @Value("${app.seed.superadmin-email:}")
    private String superadminEmail;

    @Value("${app.seed.superadmin-password:}")
    private String superadminPassword;

    @Override
    public void run(String... args) {
        ensureSaasPlans();
        Empresa empresa = ensureEmpresaSemilla();
        ensureUser(adminEmail, adminPassword, "Administrador", "Sistema", "ADMIN", empresa);
        ensureUser(orDefaultEmail(auxEmail, DEF_AUX_EMAIL), orDefaultPassword(auxPassword, DEF_AUX_PASSWORD), "Auxiliar", "Bodega", "AUX_BODEGA", empresa);
        ensureUser(
                orDefaultEmail(comprasEmail, DEF_COMPRAS_EMAIL),
                orDefaultPassword(comprasPassword, DEF_COMPRAS_PASSWORD),
                "Resp. abastecimiento",
                "Demo",
                "COMPRAS",
                empresa);
        ensureUser(orDefaultEmail(gerenciaEmail, DEF_GERENCIA_EMAIL), orDefaultPassword(gerenciaPassword, DEF_GERENCIA_PASSWORD), "Gerencia", "Demo", "GERENCIA", empresa);
        ensureUser(
                orDefaultEmail(ventasEmail, DEF_VENTAS_EMAIL),
                orDefaultPassword(ventasPassword, DEF_VENTAS_PASSWORD),
                "Resp. ventas",
                "Demo",
                "VENTAS",
                empresa);
        ensureSuperAdmin(empresa);
    }

    private void ensureSaasPlans() {
        Instant now = Instant.now();
        if (saasPlanRepository.count() == 0) {
            for (SaasPlanPublicCatalog.Row row : SaasPlanPublicCatalog.ROWS) {
                saasPlanRepository.save(SaasPlanPublicCatalog.toNewEntity(row, now));
            }
            log.info("Planes SaaS semilla creados desde SaasPlanPublicCatalog (STARTER, PROFESIONAL, EMPRESA).");
        }
        syncSaasPlansWithCatalog();
    }

    /**
     * Mantiene precios COP y textos públicos alineados con {@link SaasPlanPublicCatalog}
     * sin borrar filas (compatibilidad con suscripciones existentes).
     */
    private void syncSaasPlansWithCatalog() {
        for (SaasPlanPublicCatalog.Row row : SaasPlanPublicCatalog.ROWS) {
            saasPlanRepository
                    .findByCodigoIgnoreCase(row.codigo())
                    .ifPresent(
                            plan -> {
                                SaasPlanPublicCatalog.applyCatalogTo(plan, row);
                                saasPlanRepository.save(plan);
                            });
        }
    }

    private Empresa ensureEmpresaSemilla() {
        String ident = empresaIdentificacion == null ? "" : empresaIdentificacion.trim();
        if (ident.isEmpty()) {
            throw new IllegalStateException("app.seed.empresa-identificacion no puede estar vacío");
        }
        return empresaRepository.findByIdentificacion(ident).orElseGet(() -> {
            Empresa e = Empresa.builder()
                    .nombre("Empresa semilla (" + ident + ")")
                    .identificacion(ident)
                    .emailContacto("contacto@" + ident.toLowerCase(Locale.ROOT) + ".local")
                    .estado(EstadoEmpresa.ACTIVA)
                    .createdAt(Instant.now())
                    .build();
            Empresa saved = empresaRepository.save(e);
            log.info("Empresa semilla creada: {} ({})", saved.getNombre(), ident);
            return saved;
        });
    }

    private void ensureSuperAdmin(Empresa empresa) {
        String e = superadminEmail == null ? "" : superadminEmail.trim().toLowerCase(Locale.ROOT);
        if (e.isEmpty()) {
            return;
        }
        if (superadminPassword == null || superadminPassword.isBlank()) {
            log.warn("SUPER_ADMIN omitido para {}: contraseña vacía (defina app.seed.superadmin-password).", e);
            return;
        }
        ensureUser(e, superadminPassword.trim(), "Super", "Administrador", "SUPER_ADMIN", empresa);
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

    private void ensureUser(String email, String password, String nombre, String apellido, String rolCodigo, Empresa empresa) {
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
                        "Rol " + rolCodigo + " no existe. Ejecutar database/schema.sql, database/migrations/002_multiempresa.sql o dev_verify_and_seed.sql"));
        Usuario u = new Usuario();
        u.setEmpresa(empresa);
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

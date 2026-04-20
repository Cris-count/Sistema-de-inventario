package com.inventario.service.mfa;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.entity.EstadoEmpresa;
import com.inventario.domain.entity.Rol;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.domain.repository.RolRepository;
import com.inventario.domain.repository.UsuarioRepository;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.CodeGenerationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(
        properties = {
            "app.rate-limit.backend=memory",
            "app.rate-limit.redis.host="
        })
@ActiveProfiles("test")
class MfaBackupCodeServiceConcurrencyIT {

    @Autowired
    private MfaBackupCodeService mfaBackupCodeService;

    @Autowired
    private MfaTotpService mfaTotpService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private Long usuarioId;
    private String singleBackupPlain;

    @BeforeEach
    void setUp() {
        Empresa emp = empresaRepository.save(Empresa.builder()
                .nombre("MFA backup test " + System.nanoTime())
                .identificacion("MFA-BK-" + System.nanoTime())
                .estado(EstadoEmpresa.ACTIVA)
                .createdAt(Instant.now())
                .build());
        Rol rol = rolRepository.findByCodigo("ADMIN").orElseThrow();
        Usuario u = new Usuario();
        u.setEmpresa(emp);
        u.setEmail("mfa-backup-" + System.nanoTime() + "@test.local");
        u.setPasswordHash(passwordEncoder.encode("x"));
        u.setNombre("T");
        u.setApellido("T");
        u.setRol(rol);
        u.setActivo(true);
        u.setMfaEnabled(false);
        u.setCreatedAt(Instant.now());
        u = usuarioRepository.save(u);
        usuarioId = u.getId();
        List<String> plains = mfaBackupCodeService.replaceCodesForUser(u, 3);
        singleBackupPlain = plains.get(0);
    }

    @Test
    void backupCode_valid_consumedOnce() {
        assertTrue(mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain));
    }

    @Test
    void backupCode_secondAttemptWithSameCode_returnsFalse() {
        assertTrue(mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain));
        assertFalse(mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain));
    }

    @Test
    void concurrentVerifyAndConsume_samePlainBackup_onlyOneTransactionSucceeds() throws Exception {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        AtomicInteger successCount = new AtomicInteger(0);
        try {
            Future<Boolean> f1 = pool.submit(() -> {
                start.await();
                return Boolean.TRUE.equals(tx.execute(status -> mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain)));
            });
            Future<Boolean> f2 = pool.submit(() -> {
                start.await();
                return Boolean.TRUE.equals(tx.execute(status -> mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain)));
            });
            start.countDown();
            if (Boolean.TRUE.equals(f1.get())) {
                successCount.incrementAndGet();
            }
            if (Boolean.TRUE.equals(f2.get())) {
                successCount.incrementAndGet();
            }
        } finally {
            pool.shutdown();
        }

        assertEquals(1, successCount.get());
        assertFalse(mfaBackupCodeService.verifyAndConsume(usuarioId, singleBackupPlain));
    }

    @Test
    void totpVerification_stillWorks_unrelatedToBackupConsumption() throws CodeGenerationException {
        String secret = mfaTotpService.generateSecretBase32();
        DefaultCodeGenerator generator = new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
        long counter = System.currentTimeMillis() / 1000 / 30;
        String code = generator.generate(secret, counter);
        assertTrue(mfaTotpService.verify(secret, code));
    }
}

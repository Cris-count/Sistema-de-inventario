package com.inventario.service.mfa;

import com.inventario.domain.entity.MfaBackupCode;
import com.inventario.domain.entity.Usuario;
import com.inventario.domain.repository.MfaBackupCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Generación y verificación de códigos de respaldo (hash BCrypt).
 * El consumo serializa por usuario mediante bloqueo pesimista de todas las filas no usadas antes de {@code matches},
 * de modo que dos hilos no pueden marcar el mismo código como válido.
 */
@Service
@RequiredArgsConstructor
public class MfaBackupCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String HEX = "0123456789ABCDEF";
    /** Longitud del código en claro mostrado una sola vez al usuario. */
    public static final int PLAIN_CODE_LENGTH = 8;

    private final MfaBackupCodeRepository repository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Reemplaza todos los códigos de respaldo del usuario por un lote nuevo; devuelve valores en claro una sola vez.
     */
    @Transactional
    public List<String> replaceCodesForUser(Usuario usuario, int count) {
        repository.deleteByUsuarioId(usuario.getId());
        int n = Math.max(0, count);
        Instant now = Instant.now();
        List<String> plain = new ArrayList<>(n);
        for (int i = 0; i < n; i++) {
            String p = generatePlainCode();
            plain.add(p);
            MfaBackupCode row = MfaBackupCode.builder()
                    .usuario(usuario)
                    .codeHash(passwordEncoder.encode(p))
                    .createdAt(now)
                    .build();
            repository.save(row);
        }
        return plain;
    }

    @Transactional
    public void deleteAllForUser(Long usuarioId) {
        repository.deleteByUsuarioId(usuarioId);
    }

    /**
     * Si coincide con un código no usado, lo marca consumido y devuelve true.
     * Usa {@code SELECT … FOR UPDATE} sobre el lote de códigos no usados del usuario para eliminar carreras entre transacciones.
     */
    @Transactional
    public boolean verifyAndConsume(Long usuarioId, String plainCode) {
        if (plainCode == null || plainCode.isBlank()) {
            return false;
        }
        String candidate = plainCode.trim().toUpperCase();
        List<MfaBackupCode> unused = repository.lockUnusedByUsuarioIdForUpdate(usuarioId);
        Instant now = Instant.now();
        for (MfaBackupCode row : unused) {
            if (passwordEncoder.matches(candidate, row.getCodeHash())) {
                row.setUsedAt(now);
                repository.save(row);
                return true;
            }
        }
        return false;
    }

    private static String generatePlainCode() {
        StringBuilder sb = new StringBuilder(PLAIN_CODE_LENGTH);
        for (int i = 0; i < PLAIN_CODE_LENGTH; i++) {
            sb.append(HEX.charAt(RANDOM.nextInt(HEX.length())));
        }
        return sb.toString();
    }
}

package com.inventario.service.catalog;

import com.inventario.domain.entity.VentaConsecutivo;
import com.inventario.domain.repository.VentaConsecutivoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Consecutivo por empresa para {@code codigo_publico} estable (V-000001).
 */
@Service
@RequiredArgsConstructor
public class VentaConsecutivoService {

    private final VentaConsecutivoRepository ventaConsecutivoRepository;

    @Transactional(rollbackFor = Exception.class)
    public String siguienteCodigoPublico(Long empresaId) {
        Optional<VentaConsecutivo> opt = ventaConsecutivoRepository.findByEmpresaIdForUpdate(empresaId);
        VentaConsecutivo row;
        if (opt.isEmpty()) {
            VentaConsecutivo nuevo = VentaConsecutivo.builder()
                    .empresaId(empresaId)
                    .ultimo(0L)
                    .build();
            try {
                ventaConsecutivoRepository.saveAndFlush(nuevo);
            } catch (DataIntegrityViolationException ignored) {
                // Otro hilo insertó la fila; continuar con bloqueo
            }
            row = ventaConsecutivoRepository
                    .findByEmpresaIdForUpdate(empresaId)
                    .orElseThrow();
        } else {
            row = opt.get();
        }
        long next = row.getUltimo() + 1;
        row.setUltimo(next);
        ventaConsecutivoRepository.save(row);
        return String.format("V-%06d", next);
    }
}

package com.inventario.service.inventory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockBajoEvaluarListener {

    private final StockProveedorAlertProcessor processor;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStockBajoEvaluar(StockBajoEvaluarEvent event) {
        try {
            processor.procesar(event.empresaId(), event.productoId(), event.bodegaId());
        } catch (Exception ex) {
            log.warn("Evaluación alerta stock falló empresa={} producto={} bodega={}: {}",
                    event.empresaId(), event.productoId(), event.bodegaId(), ex.getMessage());
        }
    }
}

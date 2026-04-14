package com.inventario.service.tenant;

import com.inventario.domain.entity.*;
import com.inventario.web.error.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Invariantes multi-empresa entre agregados relacionados. Defensa en profundidad además de filtros por {@code empresaId}.
 */
@Service
public class TenantIntegrityService {

    /**
     * Tras resolver categoría con {@link TenantEntityLoader#requireCategoria(Long, Long)} y asignar {@code producto.empresa},
     * garantiza coherencia producto-categoría (misma empresa).
     */
    public void assertProductoAndCategoriaSameEmpresa(Producto producto, Categoria categoria) {
        if (producto.getEmpresa() == null || categoria.getEmpresa() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Datos de empresa incompletos en producto o categoría");
        }
        if (!producto.getEmpresa().getId().equals(categoria.getEmpresa().getId())) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "La categoría debe pertenecer a la misma empresa que el producto");
        }
    }

    /** Línea de movimiento: cabecera, producto y bodegas deben compartir empresa. */
    public void assertMovimientoLineCoherent(Movimiento movimiento, Producto producto, Bodega bodegaOrigen, Bodega bodegaDestino) {
        Long empresaMovId = movimiento.getEmpresa().getId();
        assertSameEmpresa("producto", producto.getEmpresa(), empresaMovId);
        if (bodegaOrigen != null) {
            assertSameEmpresa("bodega origen", bodegaOrigen.getEmpresa(), empresaMovId);
        }
        if (bodegaDestino != null) {
            assertSameEmpresa("bodega destino", bodegaDestino.getEmpresa(), empresaMovId);
        }
    }

    public void assertProveedorMatchesMovimiento(Movimiento movimiento, Proveedor proveedor) {
        if (proveedor == null) {
            return;
        }
        assertSameEmpresa("proveedor", proveedor.getEmpresa(), movimiento.getEmpresa().getId());
    }

    private static void assertSameEmpresa(String rolRecurso, Empresa empresaRecurso, Long empresaEsperadaId) {
        if (empresaRecurso == null || empresaRecurso.getId() == null) {
            throw new BusinessException(HttpStatus.CONFLICT, "Recurso sin empresa: " + rolRecurso);
        }
        if (!empresaRecurso.getId().equals(empresaEsperadaId)) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Inconsistencia multi-empresa: " + rolRecurso + " no pertenece a la empresa del movimiento");
        }
    }
}

package com.inventario.service.tenant;

import com.inventario.domain.entity.*;
import com.inventario.domain.repository.*;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Carga centralizada de entidades por tenant con respuestas HTTP alineadas a {@link com.inventario.domain.tenant.TenantAccessPolicy}:
 * no existe o no es del tenant → 404; existe pero inactivo (donde aplica) → 409.
 */
@Service
@RequiredArgsConstructor
public class TenantEntityLoader {

    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final CategoriaRepository categoriaRepository;
    private final ProveedorRepository proveedorRepository;
    private final UsuarioRepository usuarioRepository;

    public Producto requireProductoInTenant(Long id, Long empresaId) {
        return productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    public Producto requireProductoActivo(Long id, Long empresaId) {
        Producto p = requireProductoInTenant(id, empresaId);
        if (!Boolean.TRUE.equals(p.getActivo())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Producto inactivo");
        }
        return p;
    }

    public Bodega requireBodegaInTenant(Long id, Long empresaId) {
        return bodegaRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Bodega no encontrada"));
    }

    public Bodega requireBodegaActiva(Long id, Long empresaId) {
        Bodega b = requireBodegaInTenant(id, empresaId);
        if (!Boolean.TRUE.equals(b.getActivo())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Bodega inactiva");
        }
        return b;
    }

    public Categoria requireCategoria(Long id, Long empresaId) {
        return categoriaRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Categoría no encontrada"));
    }

    public Proveedor requireProveedorInTenant(Long id, Long empresaId) {
        return proveedorRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Proveedor no encontrado"));
    }

    public Proveedor requireProveedorActivo(Long id, Long empresaId) {
        Proveedor p = requireProveedorInTenant(id, empresaId);
        if (!Boolean.TRUE.equals(p.getActivo())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Proveedor inactivo");
        }
        return p;
    }

    public Usuario requireUsuarioInTenant(Long id, Long empresaId) {
        return usuarioRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
    }
}

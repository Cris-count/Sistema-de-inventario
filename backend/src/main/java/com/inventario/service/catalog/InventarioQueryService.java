package com.inventario.service.catalog;

import com.inventario.domain.entity.Inventario;
import com.inventario.domain.repository.InventarioRepository;
import com.inventario.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventarioQueryService {

    private final InventarioRepository inventarioRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<Inventario> buscar(Long productoId, Long bodegaId, Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        return inventarioRepository.buscarPorEmpresa(empresaId, productoId, bodegaId, pageable);
    }

    @Transactional(readOnly = true)
    public List<Inventario> alertas(Long bodegaId) {
        Long empresaId = currentUserService.requireEmpresaId();
        return inventarioRepository.findBajoMinimoPorEmpresa(empresaId, bodegaId);
    }
}

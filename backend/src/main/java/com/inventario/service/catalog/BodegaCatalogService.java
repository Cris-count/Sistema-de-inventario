package com.inventario.service.catalog;

import com.inventario.domain.entity.Bodega;
import com.inventario.domain.repository.BodegaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.tenant.TenantEntityLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BodegaCatalogService {

    private final BodegaRepository bodegaRepository;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;

    @Transactional(readOnly = true)
    public List<Bodega> listar() {
        return bodegaRepository.findByEmpresaIdOrderByNombreAsc(currentUserService.requireEmpresaId());
    }

    @Transactional
    public Bodega crear(String codigo, String nombre, String direccion) {
        var empresa = currentUserService.requireEmpresa();
        Bodega b = new Bodega();
        b.setEmpresa(empresa);
        b.setCodigo(codigo.trim());
        b.setNombre(nombre);
        b.setDireccion(direccion);
        b.setActivo(true);
        b.setCreatedAt(Instant.now());
        b.setCreatedBy(currentUserService.requireUsuario());
        return bodegaRepository.save(b);
    }

    @Transactional
    public Bodega actualizar(Long id, String codigo, String nombre, String direccion) {
        Long empresaId = currentUserService.requireEmpresaId();
        Bodega b = tenantEntityLoader.requireBodegaInTenant(id, empresaId);
        b.setCodigo(codigo.trim());
        b.setNombre(nombre);
        b.setDireccion(direccion);
        b.setUpdatedAt(Instant.now());
        return bodegaRepository.save(b);
    }
}

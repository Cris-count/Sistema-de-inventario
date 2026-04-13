package com.inventario.service.catalog;

import com.inventario.domain.entity.Proveedor;
import com.inventario.domain.repository.ProveedorRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.tenant.TenantEntityLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProveedorCatalogService {

    private final ProveedorRepository proveedorRepository;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;

    @Transactional(readOnly = true)
    public List<Proveedor> listar() {
        return proveedorRepository.findByEmpresaIdOrderByRazonSocialAsc(currentUserService.requireEmpresaId());
    }

    @Transactional
    public Proveedor crear(String documento, String razonSocial, String contacto, String telefono, String email) {
        var empresa = currentUserService.requireEmpresa();
        Proveedor p = new Proveedor();
        p.setEmpresa(empresa);
        p.setDocumento(documento.trim());
        p.setRazonSocial(razonSocial);
        p.setContacto(contacto);
        p.setTelefono(telefono);
        p.setEmail(email);
        p.setActivo(true);
        p.setCreatedAt(Instant.now());
        p.setCreatedBy(currentUserService.requireUsuario());
        return proveedorRepository.save(p);
    }

    @Transactional
    public Proveedor actualizar(Long id, String documento, String razonSocial, String contacto, String telefono, String email) {
        Long empresaId = currentUserService.requireEmpresaId();
        Proveedor p = tenantEntityLoader.requireProveedorInTenant(id, empresaId);
        p.setDocumento(documento.trim());
        p.setRazonSocial(razonSocial);
        p.setContacto(contacto);
        p.setTelefono(telefono);
        p.setEmail(email);
        p.setUpdatedAt(Instant.now());
        return proveedorRepository.save(p);
    }
}

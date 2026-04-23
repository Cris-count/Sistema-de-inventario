package com.inventario.service.catalog;

import com.inventario.domain.entity.Cliente;
import com.inventario.domain.entity.Empresa;
import com.inventario.domain.repository.ClienteRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.service.tenant.TenantEntityLoader;
import com.inventario.web.error.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ClienteCatalogService {

    private final ClienteRepository clienteRepository;
    private final CurrentUserService currentUserService;
    private final TenantEntityLoader tenantEntityLoader;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public Page<Cliente> listar(Pageable pageable) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        return clienteRepository.findByEmpresa_IdAndActivoIsTrueOrderByNombreAsc(empresaId, pageable);
    }

    @Transactional
    public Cliente crear(String nombre, String documento, String telefono, String email) {
        var usuario = currentUserService.requireUsuario();
        Long empresaId = usuario.getEmpresa().getId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.MOVIMIENTOS_BASICOS);
        String n = nombre == null ? "" : nombre.trim();
        if (n.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Nombre del cliente obligatorio");
        }
        Empresa empresa = usuario.getEmpresa();
        String doc = trimToNull(documento);
        if (doc != null
                && clienteRepository.existsByEmpresa_IdAndActivoIsTrueAndDocumentoIgnoreCase(empresaId, doc)) {
            throw new BusinessException(
                    HttpStatus.CONFLICT,
                    "Ya existe un cliente activo con el mismo documento en la empresa.");
        }
        Cliente c = new Cliente();
        c.setEmpresa(empresa);
        c.setNombre(n);
        c.setDocumento(doc);
        c.setTelefono(trimToNull(telefono));
        c.setEmail(trimToNull(email));
        c.setActivo(true);
        c.setCreatedAt(Instant.now());
        return clienteRepository.save(c);
    }

    @Transactional(readOnly = true)
    public Cliente obtener(Long id) {
        Long empresaId = currentUserService.requireEmpresaId();
        planEntitlementService.requireModulo(empresaId, PlanEntitlementCodes.CONSULTA_STOCK);
        return tenantEntityLoader.requireClienteActivo(id, empresaId);
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}

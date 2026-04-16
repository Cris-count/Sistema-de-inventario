package com.inventario.service.catalog;

import com.inventario.domain.entity.Empresa;
import com.inventario.domain.repository.EmpresaRepository;
import com.inventario.service.CurrentUserService;
import com.inventario.service.saas.PlanEntitlementCodes;
import com.inventario.service.saas.PlanEntitlementService;
import com.inventario.web.dto.EmpresaMiDtos.EmpresaMiUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class EmpresaProfileService {

    private final CurrentUserService currentUserService;
    private final EmpresaRepository empresaRepository;
    private final PlanEntitlementService planEntitlementService;

    @Transactional(readOnly = true)
    public Empresa miEmpresa() {
        return currentUserService.requireEmpresa();
    }

    @Transactional
    public Empresa actualizarMiEmpresa(EmpresaMiUpdateRequest req) {
        Empresa e = currentUserService.requireEmpresa();
        planEntitlementService.requireModulo(e.getId(), PlanEntitlementCodes.CONFIGURACION_EMPRESA);
        e.setNombre(req.getNombre().trim());
        String mail = req.getEmailContacto();
        e.setEmailContacto(mail != null && !mail.isBlank() ? mail.trim() : null);
        String tel = req.getTelefono();
        e.setTelefono(tel != null && !tel.isBlank() ? tel.trim() : null);
        if (req.getEmailNotificacionesInventario() != null) {
            String en = req.getEmailNotificacionesInventario();
            e.setEmailNotificacionesInventario(en != null && !en.isBlank() ? en.trim() : null);
        }
        if (req.getAlertasPedidoProveedorActivas() != null) {
            e.setAlertasPedidoProveedorActivas(req.getAlertasPedidoProveedorActivas());
        }
        if (req.getPedidoProveedorCantidadMaxima() != null) {
            BigDecimal m = req.getPedidoProveedorCantidadMaxima();
            e.setPedidoProveedorCantidadMaxima(m.compareTo(BigDecimal.ZERO) > 0 ? m : null);
        }
        e.setUpdatedAt(Instant.now());
        e.setUpdatedBy(currentUserService.requireUsuario());
        return empresaRepository.save(e);
    }
}

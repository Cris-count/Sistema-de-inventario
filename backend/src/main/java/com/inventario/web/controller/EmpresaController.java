package com.inventario.web.controller;

import com.inventario.domain.entity.Empresa;
import com.inventario.service.catalog.EmpresaProfileService;
import com.inventario.web.dto.EmpresaMiDtos.EmpresaMiUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/empresa")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearer-jwt")
public class EmpresaController {

    private final EmpresaProfileService empresaProfileService;

    public record EmpresaActualResponse(
            Long id,
            String nombre,
            String identificacion,
            String emailContacto,
            String telefono,
            String estado
    ) {}

    @GetMapping("/mi")
    @Operation(summary = "Empresa del usuario autenticado")
    public EmpresaActualResponse miEmpresa() {
        return toResponse(empresaProfileService.miEmpresa());
    }

    @PutMapping("/mi")
    @PreAuthorize("hasAnyAuthority('ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Actualizar datos básicos de la empresa del usuario (sin cambiar identificación tributaria)")
    public EmpresaActualResponse actualizarMiEmpresa(@Valid @RequestBody EmpresaMiUpdateRequest req) {
        return toResponse(empresaProfileService.actualizarMiEmpresa(req));
    }

    private static EmpresaActualResponse toResponse(Empresa e) {
        return new EmpresaActualResponse(
                e.getId(),
                e.getNombre(),
                e.getIdentificacion(),
                e.getEmailContacto(),
                e.getTelefono(),
                e.getEstado() != null ? e.getEstado().name() : null
        );
    }
}

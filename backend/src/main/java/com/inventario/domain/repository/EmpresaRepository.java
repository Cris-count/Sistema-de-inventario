package com.inventario.domain.repository;

import com.inventario.domain.entity.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    Optional<Empresa> findByIdentificacion(String identificacion);
}

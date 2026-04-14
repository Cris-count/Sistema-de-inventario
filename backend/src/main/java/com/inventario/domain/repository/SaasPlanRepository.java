package com.inventario.domain.repository;

import com.inventario.domain.entity.SaasPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SaasPlanRepository extends JpaRepository<SaasPlan, Long> {

    Optional<SaasPlan> findByCodigoIgnoreCaseAndActivoIsTrue(String codigo);

    List<SaasPlan> findAllByActivoIsTrueOrderByOrdenAsc();
}

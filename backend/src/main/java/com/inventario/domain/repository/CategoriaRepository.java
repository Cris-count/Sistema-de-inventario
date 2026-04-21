package com.inventario.domain.repository;

import com.inventario.domain.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {

    List<Categoria> findByEmpresaIdOrderByNombreAsc(Long empresaId);

    Optional<Categoria> findByIdAndEmpresaId(Long id, Long empresaId);

    @Query(
            "select case when count(c) > 0 then true else false end from Categoria c "
                    + "where c.empresa.id = :empresaId and lower(trim(c.nombre)) = lower(trim(:nombre))")
    boolean existsByEmpresaIdAndNombreNormalized(@Param("empresaId") Long empresaId, @Param("nombre") String nombre);

    @Query(
            "select case when count(c) > 0 then true else false end from Categoria c "
                    + "where c.empresa.id = :empresaId and c.id <> :excludeId "
                    + "and lower(trim(c.nombre)) = lower(trim(:nombre))")
    boolean existsByEmpresaIdAndNombreNormalizedExcluding(
            @Param("empresaId") Long empresaId,
            @Param("nombre") String nombre,
            @Param("excludeId") Long excludeId);
}

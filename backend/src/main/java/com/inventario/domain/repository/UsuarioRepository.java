package com.inventario.domain.repository;

import com.inventario.domain.entity.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    long countByEmpresa_Id(Long empresaId);
    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<Usuario> findByEmpresaId(Long empresaId, Pageable pageable);

    Optional<Usuario> findByIdAndEmpresaId(Long id, Long empresaId);

    List<Usuario> findByEmpresa_IdAndRol_CodigoAndActivoIsFalse(Long empresaId, String rolCodigo);
}

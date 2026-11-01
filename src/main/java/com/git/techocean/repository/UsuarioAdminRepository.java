package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.git.techocean.model.UsuarioAdmin;

public interface UsuarioAdminRepository extends JpaRepository<UsuarioAdmin, Long> {

    // Busca usuário administrativo por e-mail para validação de acesso/login (RF10)
    UsuarioAdmin findByEmail(String email);
    UsuarioAdmin findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    @Query("select count(u) from UsuarioAdmin u where upper(trim(u.cargo)) = 'ADMIN'")
    long countAdmins();
}

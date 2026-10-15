package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.UsuarioAdmin;

@Repository
public interface UsuarioAdminRepository extends JpaRepository<UsuarioAdmin, Long> {

    // Busca usuário administrativo por e-mail para validação de acesso/login (RF10)
    UsuarioAdmin findByEmail(String email);
}
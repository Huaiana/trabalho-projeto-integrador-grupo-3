package com.git.techocean.repository;

import com.git.techocean.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Usuario findByEmailIgnoreCase(String email);
}

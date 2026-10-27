package com.git.techocean.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Cliente;
import java.util.List;


@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    // Busca cliente pelo e-mail para autenticação de login (RF02)
    Cliente findByEmail(String email);

    // Valida se já existe cliente cadastrado com o e-mail
    boolean existsByEmail(String email);

    // Buscar cliente pelo telefone enviando um código para autenticação de login (RF02)

    Cliente findByTelefone(String telefone);

    // Validar se já exixte cliente cadastrado com esse número de telefone

    boolean existsByTelefone(String Telefone);


}
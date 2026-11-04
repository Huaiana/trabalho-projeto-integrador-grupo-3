package com.git.techocean.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.git.techocean.model.ContatoMensagem;

public interface ContatoMensagemRepository extends JpaRepository<ContatoMensagem, Long> {

    List<ContatoMensagem> findAllByOrderByCriadoEmDesc();
}

package com.git.techocean.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Servico;

@Repository
public interface ServicoRepository extends JpaRepository<Servico, Long> {

    // Lista apenas serviços disponíveis para exibição no catálogo (RF07)
    List<Servico> findByDisponivelTrue();

    // Filtra serviços por categoria (ex: amarração, proteção, consultoria)
    List<Servico> findByCategoria(String categoria);
}
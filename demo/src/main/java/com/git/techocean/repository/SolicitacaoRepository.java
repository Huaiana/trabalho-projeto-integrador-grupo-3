package com.git.techocean.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.git.techocean.model.Solicitacao;

public interface SolicitacaoRepository extends JpaRepository<Solicitacao, Long> {

    // Lista todas as solicitações efetuadas por um cliente específico
    List<Solicitacao> findByClienteId(Long clienteId);

    // Filtra solicitações por status (ex: PENDENTE, EM_ANALISE, APROVADA, CANCELADA) - RF04 e RF05
    List<Solicitacao> findByStatus(String status);
}
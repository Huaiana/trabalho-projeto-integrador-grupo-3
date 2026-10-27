package com.git.techocean.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Orcamento;

@Repository
public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {

    // Lista orçamentos/solicitações de um cliente específico
    List<Orcamento> findByClienteId(Long clienteId);

    // Filtra orçamentos por status (ex: PENDENTE, EM_ANALISE, APROVADO) para o painel admin (RF04/RF05)
    List<Orcamento> findByStatus(String status);
}
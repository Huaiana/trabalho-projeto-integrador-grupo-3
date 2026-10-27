package com.git.techocean.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.git.techocean.model.Operacao;

@Repository
public interface OperacaoRepository extends JpaRepository<Operacao, Long> {

    // Busca a operação associada a um orçamento/solicitação específica
    Operacao findBySolicitacaoId(Long solicitacaoId);

    // Lista operações por status de andamento (RF09)
    List<Operacao> findByAndamento(String andamento);
}
package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Conteiner;
import com.git.techocean.model.Operacao;
import com.git.techocean.model.Solicitacao;
import com.git.techocean.repository.ConteinerRepository;
import com.git.techocean.repository.OperacaoRepository;
import com.git.techocean.repository.SolicitacaoRepository;

@Service
public class OperacaoService {

    private final OperacaoRepository operacaoRepository;
    private final SolicitacaoRepository solicitacaoRepository;
    private final ConteinerRepository conteinerRepository;

    public OperacaoService(OperacaoRepository operacaoRepository, SolicitacaoRepository solicitacaoRepository, ConteinerRepository conteinerRepository) {
        this.operacaoRepository = operacaoRepository;
        this.solicitacaoRepository = solicitacaoRepository;
        this.conteinerRepository = conteinerRepository;
    }

    public Operacao iniciarOperacao(Long solicitacaoId, Long conteinerId, String responsavel, String observacoes) {
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
        
        Conteiner conteiner = null;
        if (conteinerId != null) {
            conteiner = conteinerRepository.findById(conteinerId).orElse(null);
        }

        return operacaoRepository.save(new Operacao(solicitacao, conteiner, responsavel, "EM_ANDAMENTO", observacoes));
    }

    public List<Operacao> listar() {
        return operacaoRepository.findAll();
    }

    public Operacao atualizarAndamento(Long id, String andamento, String observacoes) {
        Operacao op = operacaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operação não encontrada."));
        
        op.setAndamento(andamento);
        if (observacoes != null) op.setObservacoes(observacoes);
        return operacaoRepository.save(op);
    }
}
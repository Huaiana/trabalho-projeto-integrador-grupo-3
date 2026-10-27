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
        if (solicitacaoId == null || solicitacaoId <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Solicitação inválida.");
        validarTexto(responsavel, "Responsável");
        validarTexto(observacoes, "Observações");
        Solicitacao solicitacao = solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
        
        Conteiner conteiner = null;
        if (conteinerId != null) {
            conteiner = conteinerRepository.findById(conteinerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contêiner não encontrado."));
        }

        return operacaoRepository.save(new Operacao(solicitacao, conteiner, responsavel, "EM_ANDAMENTO", observacoes));
    }

    public List<Operacao> listar() {
        return operacaoRepository.findAll();
    }

    public Operacao atualizarAndamento(Long id, String andamento, String observacoes) {
        Operacao op = buscarPorId(id);
        validarTexto(andamento, "Andamento");
        
        op.setAndamento(andamento);
        if (observacoes != null) op.setObservacoes(observacoes);
        return operacaoRepository.save(op);
    }

    public Operacao buscarPorId(Long id) {
        validarId(id);
        return operacaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operação não encontrada."));
    }

    public Operacao atualizar(Long id, Long solicitacaoId, Long conteinerId, String responsavel, String andamento, String observacoes) {
        Operacao op = buscarPorId(id);
        if (solicitacaoId != null) op.setSolicitacao(solicitacaoRepository.findById(solicitacaoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitação não encontrada.")));
        if (conteinerId != null) op.setConteiner(conteinerRepository.findById(conteinerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contêiner não encontrado.")));
        validarTexto(responsavel, "Responsável"); validarTexto(andamento, "Andamento"); validarTexto(observacoes, "Observações");
        op.setResponsavel(responsavel.trim()); op.setAndamento(andamento.trim()); op.setObservacoes(observacoes.trim());
        return operacaoRepository.save(op);
    }

    public void excluir(Long id) { operacaoRepository.delete(buscarPorId(id)); }

    private void validarId(Long id) { if (id == null || id <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID inválido."); }
    private void validarTexto(String valor, String campo) {
        if (valor == null || valor.trim().isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, campo + " é obrigatório.");
    }
}

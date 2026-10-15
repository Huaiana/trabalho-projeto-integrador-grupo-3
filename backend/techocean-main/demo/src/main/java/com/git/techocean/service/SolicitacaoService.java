package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Carga;
import com.git.techocean.model.Cliente;
import com.git.techocean.model.Servico;
import com.git.techocean.model.Solicitacao;
import com.git.techocean.repository.CargaRepository;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.ServicoRepository;
import com.git.techocean.repository.SolicitacaoRepository;

@Service
public class SolicitacaoService {

    private final SolicitacaoRepository solicitacaoRepository;
    private final ClienteRepository clienteRepository;
    private final CargaRepository cargaRepository;
    private final ServicoRepository servicoRepository;

    public SolicitacaoService(SolicitacaoRepository solicitacaoRepository, ClienteRepository clienteRepository,
                              CargaRepository cargaRepository, ServicoRepository servicoRepository) {
        this.solicitacaoRepository = solicitacaoRepository;
        this.clienteRepository = clienteRepository;
        this.cargaRepository = cargaRepository;
        this.servicoRepository = servicoRepository;
    }

    public Solicitacao criarSolicitacao(Long clienteId, Long cargaId, Long servicoId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
        Carga carga = cargaRepository.findById(cargaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carga não encontrada."));
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));

        return solicitacaoRepository.save(new Solicitacao(cliente, carga, servico, "PENDENTE"));
    }

    public List<Solicitacao> listar() {
        return solicitacaoRepository.findAll();
    }

    public List<Solicitacao> listarPorCliente(Long clienteId) {
        return solicitacaoRepository.findByClienteId(clienteId);
    }

    public Solicitacao buscarPorId(Long id) {
        return solicitacaoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Solicitação não encontrada."));
    }

    public Solicitacao atualizarStatus(Long id, String status) {
        Solicitacao solicitacao = buscarPorId(id);
        solicitacao.setStatus(status);
        return solicitacaoRepository.save(solicitacao);
    }
}

package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Carga;
import com.git.techocean.model.Cliente;
import com.git.techocean.model.Orcamento;
import com.git.techocean.model.Servico;
import com.git.techocean.repository.CargaRepository;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.OrcamentoRepository;
import com.git.techocean.repository.ServicoRepository;

@Service
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final ClienteRepository clienteRepository;
    private final CargaRepository cargaRepository;
    private final ServicoRepository servicoRepository;

    public OrcamentoService(OrcamentoRepository orcamentoRepository, ClienteRepository clienteRepository,
                            CargaRepository cargaRepository, ServicoRepository servicoRepository) {
        this.orcamentoRepository = orcamentoRepository;
        this.clienteRepository = clienteRepository;
        this.cargaRepository = cargaRepository;
        this.servicoRepository = servicoRepository;
    }

    public Orcamento criarOrcamento(Long clienteId, Long cargaId, Long servicoId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
        Carga carga = cargaRepository.findById(cargaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carga não encontrada."));
        Servico servico = servicoRepository.findById(servicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));

        return orcamentoRepository.save(new Orcamento(cliente, carga, servico, "PENDENTE"));
    }

    public List<Orcamento> listar() {
        return orcamentoRepository.findAll();
    }

    public List<Orcamento> listarPorCliente(Long clienteId) {
        return orcamentoRepository.findByClienteId(clienteId);
    }

    public Orcamento atualizarAnalise(Long id, String status, Double valorEstimado, String observacoes) {
        Orcamento orcamento = orcamentoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Orçamento não encontrado."));

        orcamento.setStatus(status);
        if (valorEstimado != null) {
            orcamento.setValorEstimado(valorEstimado);
        }
        if (observacoes != null) {
            orcamento.setObservacoes(observacoes);
        }

        return orcamentoRepository.save(orcamento);
    }
}

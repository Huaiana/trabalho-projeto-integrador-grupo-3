package com.git.techocean.service;

import com.git.techocean.model.*;
import com.git.techocean.repository.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SolicitacaoCompartilhadaService {
    private final SolicitacaoRepository solicitacoes;
    private final SolicitacaoDetalheCompartilhadoRepository detalhes;
    private final ClienteRepository clientes;
    private final CargaRepository cargas;
    private final ServicoRepository servicos;
    private final UsuarioAdminRepository usuarios;
    private final ReferenciaCompartilhadaRepository referencias;

    public SolicitacaoCompartilhadaService(SolicitacaoRepository solicitacoes,
            SolicitacaoDetalheCompartilhadoRepository detalhes, ClienteRepository clientes,
            CargaRepository cargas, ServicoRepository servicos, UsuarioAdminRepository usuarios,
            ReferenciaCompartilhadaRepository referencias) {
        this.solicitacoes = solicitacoes;
        this.detalhes = detalhes;
        this.clientes = clientes;
        this.cargas = cargas;
        this.servicos = servicos;
        this.usuarios = usuarios;
        this.referencias = referencias;
    }

    public record Pedido(Long clienteId, Long cargaOperacionalId, Long servicoOperacionalId,
            String nomeServico, String categoria, String descricao, Long servicoReferenciaId,
            Long cargaReferenciaId, Long conteinerReferenciaId, Long operacaoReferenciaId,
            Long orcamentoReferenciaId, BigDecimal valor, Long prestadorId, String statusSolicitacao, Long versao) {}
    public record Pessoa(Long id, String nome, String cargo) {}
    public record Resultado(Long id, Pessoa solicitante, Carga cargaOperacional, Servico servicoOperacional,
            String nomeServico, String categoria, String descricao, ReferenciaCompartilhada servicoReferencia,
            ReferenciaCompartilhada cargaReferencia, ReferenciaCompartilhada conteinerReferencia,
            ReferenciaCompartilhada operacaoReferencia, ReferenciaCompartilhada orcamentoReferencia,
            BigDecimal valor, Pessoa prestador, String statusSolicitacao, String statusOperacional, Instant criadoEm, Long versao) {}

    @Transactional(readOnly = true)
    public List<Resultado> listar() {
        return detalhes.findAll().stream().map(this::resultado).toList();
    }

    @Transactional
    public Resultado criar(Pedido pedido) {
        return salvar(null, pedido);
    }

    @Transactional
    public Resultado atualizar(Long id, Pedido pedido) {
        return salvar(Objects.requireNonNull(id), pedido);
    }

    private Resultado salvar(Long id, Pedido pedido) {
        validarTexto(pedido.nomeServico(), 255, "Nome do serviço");
        validarTexto(pedido.categoria(), 255, "Categoria");
        validarTexto(pedido.descricao(), 2000, "Descrição");
        if (pedido.statusSolicitacao() == null || !Set.of("SIM", "NAO", "EM_ANALISE").contains(pedido.statusSolicitacao())) {
            throw invalido("Status da solicitação inválido.");
        }
        if (pedido.valor() != null && (pedido.valor().signum() < 0 || pedido.valor().scale() > 2
                || pedido.valor().precision() - pedido.valor().scale() > 13)) {
            throw invalido("Valor inválido.");
        }
        Cliente cliente = clientes.findById(idObrigatorio(pedido.clienteId(), "Cliente"))
                .orElseThrow(() -> naoEncontrado("Cliente"));
        Carga carga = cargas.findById(idObrigatorio(pedido.cargaOperacionalId(), "Carga operacional"))
                .orElseThrow(() -> naoEncontrado("Carga operacional"));
        Servico servico = servicos.findById(idObrigatorio(pedido.servicoOperacionalId(), "Serviço operacional"))
                .orElseThrow(() -> naoEncontrado("Serviço operacional"));
        UsuarioAdmin prestador = usuarios.findById(idObrigatorio(pedido.prestadorId(), "Prestador"))
                .orElseThrow(() -> naoEncontrado("Prestador"));
        ReferenciaCompartilhada srv = referencia(pedido.servicoReferenciaId(), "SRV");
        ReferenciaCompartilhada crg = referencia(pedido.cargaReferenciaId(), "CRG");
        ReferenciaCompartilhada ctr = referencia(pedido.conteinerReferenciaId(), "CTR");
        ReferenciaCompartilhada opr = referencia(pedido.operacaoReferenciaId(), "OPR");
        ReferenciaCompartilhada orc = referencia(pedido.orcamentoReferenciaId(), "ORC");
        SolicitacaoDetalheCompartilhado detalhe;
        Solicitacao solicitacao;
        if (id == null) {
            solicitacao = solicitacoes.save(new Solicitacao(cliente, carga, servico, "PENDENTE"));
            detalhe = new SolicitacaoDetalheCompartilhado();
            detalhe.setSolicitacao(solicitacao);
            detalhe.setCriadoEm(Instant.now());
        } else {
            detalhe = detalhes.findById(idObrigatorio(id, "Solicitação")).orElseThrow(() -> naoEncontrado("Detalhes da solicitação"));
            if (!Objects.equals(detalhe.getVersao(), pedido.versao())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A solicitação foi alterada. Atualize e tente novamente.");
            }
            solicitacao = detalhe.getSolicitacao();
            solicitacao.setCliente(cliente);
            solicitacao.setCarga(carga);
            solicitacao.setServico(servico);
        }
        detalhe.setNomeServico(pedido.nomeServico().trim());
        detalhe.setCategoria(pedido.categoria().trim());
        detalhe.setDescricao(pedido.descricao().trim());
        detalhe.setServicoReferencia(srv);
        detalhe.setCargaReferencia(crg);
        detalhe.setConteinerReferencia(ctr);
        detalhe.setOperacaoReferencia(opr);
        detalhe.setOrcamentoReferencia(orc);
        detalhe.setValor(pedido.valor());
        detalhe.setPrestadorId(prestador.getId());
        detalhe.setPrestadorNome(prestador.getNome());
        detalhe.setPrestadorCargo(prestador.getCargo());
        detalhe.setStatusSolicitacao(pedido.statusSolicitacao());
        Instant agora = Instant.now();
        if (detalhe.getAtualizadoEm() != null && !agora.isAfter(detalhe.getAtualizadoEm().plusNanos(1000))) {
            agora = detalhe.getAtualizadoEm().plusNanos(1000);
        }
        detalhe.setAtualizadoEm(agora);
        return resultado(detalhes.saveAndFlush(detalhe));
    }

    private Resultado resultado(SolicitacaoDetalheCompartilhado d) {
        Solicitacao s = d.getSolicitacao();
        return new Resultado(s.getId(), new Pessoa(s.getCliente().getId(), s.getCliente().getNome(), null),
                s.getCarga(), s.getServico(), d.getNomeServico(), d.getCategoria(), d.getDescricao(),
                d.getServicoReferencia(), d.getCargaReferencia(), d.getConteinerReferencia(),
                d.getOperacaoReferencia(), d.getOrcamentoReferencia(), d.getValor(),
                new Pessoa(d.getPrestadorId(), d.getPrestadorNome(), d.getPrestadorCargo()),
                d.getStatusSolicitacao(), s.getStatus(), d.getCriadoEm(), d.getVersao());
    }

    private ReferenciaCompartilhada referencia(Long id, String tipo) {
        if (id == null) return null;
        ReferenciaCompartilhada ref = referencias.findById(idObrigatorio(id, "Referência"))
                .orElseThrow(() -> naoEncontrado("Referência"));
        if (!tipo.equals(ref.getTipo())) throw invalido("Tipo de referência incompatível: " + tipo);
        return ref;
    }

    @NonNull
    private Long idObrigatorio(Long id, String nome) {
        if (id == null || id <= 0) throw invalido(nome + " é obrigatório.");
        return id;
    }
    private void validarTexto(String texto, int limite, String nome) {
        if (texto == null || texto.isBlank() || texto.length() > limite) throw invalido(nome + " inválido.");
    }
    private ResponseStatusException invalido(String mensagem) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
    }
    private ResponseStatusException naoEncontrado(String nome) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, nome + " não encontrado.");
    }
}

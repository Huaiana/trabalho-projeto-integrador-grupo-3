package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.*;

import com.git.techocean.model.*;
import com.git.techocean.repository.*;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
@Transactional
@SuppressWarnings("null")
class SolicitacaoCompartilhadaIntegrationTest {
    @Autowired SolicitacaoCompartilhadaService service;
    @Autowired OperacaoService operacoes;
    @Autowired SolicitacaoService solicitacoes;
    @Autowired ClienteRepository clientes;
    @Autowired CargaRepository cargas;
    @Autowired ServicoRepository servicos;
    @Autowired UsuarioAdminRepository usuarios;
    @Autowired ReferenciaCompartilhadaRepository referencias;
    @Autowired EntityManager entityManager;

    @Test
    void persisteDadosCompartilhadosEAceitaOperacaoSemMudarStatusOriginal() {
        Cliente cliente = clientes.save(new Cliente("Cliente", "123", "123", "shared-test@example.com", "hash"));
        Carga carga = cargas.save(new Carga("Carga", 10.0, 3.0, "Geral", "Santos", "Recife"));
        Servico servico = servicos.save(new Servico("Inspeção", "Descrição", "Teste", true));
        UsuarioAdmin prestador = usuarios.save(new UsuarioAdmin("Pessoa", "staff-shared@example.com", "hash", "FUNCIONARIO"));
        ReferenciaCompartilhada ref = new ReferenciaCompartilhada();
        ref.setTipo("SRV");
        ref.setNome("Inspeção compartilhada");
        ref.setDescricao("Dados da referência");
        ref = referencias.saveAndFlush(ref);
        var pedido = new SolicitacaoCompartilhadaService.Pedido(cliente.getId(), carga.getId(), servico.getId(),
                "Pedido", "Operações e Navios", "Resumo", ref.getId(), null, null, null, null,
                new BigDecimal("150.50"), prestador.getId(), "EM_ANALISE", null);
        var criado = service.criar(pedido);
        entityManager.flush();
        entityManager.clear();

        var recarregado = service.listar().stream().filter(item -> item.id().equals(criado.id())).findFirst().orElseThrow();
        assertEquals("Resumo", recarregado.descricao());
        assertEquals(ref.getCodigo(), recarregado.servicoReferencia().getCodigo());
        assertEquals(0, new BigDecimal("150.50").compareTo(recarregado.valor()));
        assertEquals("EM_ANALISE", recarregado.statusSolicitacao());
        assertEquals("PENDENTE", recarregado.statusOperacional());
        assertEquals(cliente.getId(), recarregado.solicitante().id());
        assertEquals(prestador.getId(), recarregado.prestador().id());
        assertNotNull(operacoes.iniciarOperacao(criado.id(), null, "Responsável", "Observação").getId());
        solicitacoes.atualizarStatus(criado.id(), "CONFIRMADO");
        var atualizado = service.atualizar(criado.id(), new SolicitacaoCompartilhadaService.Pedido(cliente.getId(),
                carga.getId(), servico.getId(), "Pedido editado", "Operações e Navios", "Novo resumo", ref.getId(),
                null, null, null, null, BigDecimal.TEN, prestador.getId(), "SIM", recarregado.versao()));
        entityManager.flush();
        entityManager.clear();
        var persistido = service.listar().stream().filter(item -> item.id().equals(atualizado.id())).findFirst().orElseThrow();
        assertEquals("Novo resumo", persistido.descricao());
        assertEquals("SIM", persistido.statusSolicitacao());
        assertEquals("CONFIRMADO", persistido.statusOperacional());
        var tentativaAntiga = new SolicitacaoCompartilhadaService.Pedido(cliente.getId(), carga.getId(), servico.getId(),
                "Alteração antiga", "Operações e Navios", "Resumo antigo", ref.getId(), null, null, null, null,
                BigDecimal.ONE, prestador.getId(), "NAO", recarregado.versao());
        ResponseStatusException conflito = assertThrows(ResponseStatusException.class, () -> service.atualizar(criado.id(), tentativaAntiga));
        assertEquals(HttpStatus.CONFLICT, conflito.getStatusCode());
    }

    @Test
    void rejeitaStatusETipoDeReferenciaInvalidos() {
        Cliente cliente = clientes.save(new Cliente("Cliente", "456", "123", "shared-test2@example.com", "hash"));
        Carga carga = cargas.save(new Carga("Carga", 1.0, 1.0, "Geral", "Santos", "Recife"));
        Servico servico = servicos.save(new Servico("Serviço", "Descrição", "Teste", true));
        UsuarioAdmin prestador = usuarios.save(new UsuarioAdmin("Pessoa", "staff-shared2@example.com", "hash", "SUPERVISOR"));
        ReferenciaCompartilhada ref = new ReferenciaCompartilhada();
        ref.setTipo("CTR");
        ref.setNome("Contêiner");
        ref = referencias.saveAndFlush(ref);
        var pedido = new SolicitacaoCompartilhadaService.Pedido(cliente.getId(), carga.getId(), servico.getId(),
                "Pedido", "Categoria", "Resumo", ref.getId(), null, null, null, null,
                null, prestador.getId(), "SIM", null);
        ResponseStatusException erro = assertThrows(ResponseStatusException.class, () -> service.criar(pedido));
        assertEquals(HttpStatus.BAD_REQUEST, erro.getStatusCode());
        assertTrue(service.listar().isEmpty());
    }
}

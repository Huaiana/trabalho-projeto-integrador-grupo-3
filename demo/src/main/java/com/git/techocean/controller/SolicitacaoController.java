package com.git.techocean.controller;

import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Solicitacao;
import com.git.techocean.service.SolicitacaoService;

@RestController
@RequestMapping("/solicitacoes")
public class SolicitacaoController {

    private final SolicitacaoService solicitacaoService;

    public SolicitacaoController(SolicitacaoService solicitacaoService) {
        this.solicitacaoService = solicitacaoService;
    }

    // RF03 - Cadastrar solicitação
    @PostMapping
    public ResponseEntity<Solicitacao> criarSolicitacao(
            @RequestParam Long clienteId,
            @RequestParam Long cargaId,
            @RequestParam Long servicoId) {
        Solicitacao solicitacao = solicitacaoService.criarSolicitacao(
                Objects.requireNonNull(clienteId, "clienteId não pode ser nulo"),
                Objects.requireNonNull(cargaId, "cargaId não pode ser nulo"),
                Objects.requireNonNull(servicoId, "servicoId não pode ser nulo"));
        return new ResponseEntity<>(solicitacao, HttpStatus.CREATED);
    }

    // RF05 - Listagem geral de solicitações
    @GetMapping
    public ResponseEntity<List<Solicitacao>> listarTodas() {
        return new ResponseEntity<>(solicitacaoService.listar(), HttpStatus.OK);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Solicitacao>> listarPorCliente(@PathVariable Long clienteId) {
        return new ResponseEntity<>(
                solicitacaoService.listarPorCliente(Objects.requireNonNull(clienteId, "clienteId não pode ser nulo")),
                HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Solicitacao> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(
                solicitacaoService.buscarPorId(Objects.requireNonNull(id, "id não pode ser nulo")),
                HttpStatus.OK);
    }

    // RF04 - Atualizar status da solicitação
    @PutMapping("/{id}/status")
    public ResponseEntity<Solicitacao> atualizarStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Solicitacao solicitacao = solicitacaoService.atualizarStatus(id, status);
        return new ResponseEntity<>(solicitacao, HttpStatus.OK);
    }
}
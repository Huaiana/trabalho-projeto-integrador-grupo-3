package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Orcamento;
import com.git.techocean.service.OrcamentoService;

@RestController
@RequestMapping("/orcamentos")
public class OrcamentoController {

    private final OrcamentoService orcamentoService;

    public OrcamentoController(OrcamentoService orcamentoService) {
        this.orcamentoService = orcamentoService;
    }

    // RF03 - Solicitar orçamento
    @PostMapping
    public ResponseEntity<Orcamento> criarOrcamento(
            @RequestParam Long clienteId,
            @RequestParam Long cargaId,
            @RequestParam Long servicoId) {
        Orcamento orcamento = orcamentoService.criarOrcamento(clienteId, cargaId, servicoId);
        return new ResponseEntity<>(orcamento, HttpStatus.CREATED);
    }

    // RF05 - Painel administrativo: listar orçamentos
    @GetMapping
    public ResponseEntity<List<Orcamento>> listarTodos() {
        return new ResponseEntity<>(orcamentoService.listar(), HttpStatus.OK);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Orcamento>> listarPorCliente(@PathVariable Long clienteId) {
        return new ResponseEntity<>(orcamentoService.listarPorCliente(clienteId), HttpStatus.OK);
    }

    // RF04 - Atualizar status e valor do orçamento
    @PutMapping("/{id}/analise")
    public ResponseEntity<Orcamento> atualizarAnalise(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) Double valorEstimado,
            @RequestParam(required = false) String observacoes) {
        Orcamento orcamento = orcamentoService.atualizarAnalise(id, status, valorEstimado, observacoes);
        return new ResponseEntity<>(orcamento, HttpStatus.OK);
    }
}
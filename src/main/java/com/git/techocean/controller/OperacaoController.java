package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Operacao;
import com.git.techocean.service.OperacaoService;

@RestController
@RequestMapping("/operacoes")
public class OperacaoController {

    private final OperacaoService operacaoService;

    public OperacaoController(OperacaoService operacaoService) {
        this.operacaoService = operacaoService;
    }

    // RF06 - Iniciar operação
    @PostMapping
    public ResponseEntity<Operacao> iniciarOperacao(
            @RequestParam Long solicitacaoId,
            @RequestParam(required = false) Long conteinerId,
            @RequestParam String responsavel,
            @RequestParam String observacoes) {
        Operacao operacao = operacaoService.iniciarOperacao(solicitacaoId, conteinerId, responsavel, observacoes);
        return new ResponseEntity<>(operacao, HttpStatus.CREATED);
    }

    public record OperacaoRequest(Long solicitacaoId, Long conteinerId, String responsavel, String andamento, String observacoes) {}

    @PostMapping(consumes = "application/json")
    public ResponseEntity<Operacao> iniciarJson(@RequestBody OperacaoRequest request) {
        return new ResponseEntity<>(operacaoService.iniciarOperacao(request.solicitacaoId(), request.conteinerId(), request.responsavel(), request.observacoes()), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Operacao> buscarPorId(@PathVariable Long id) { return ResponseEntity.ok(operacaoService.buscarPorId(id)); }

    @PutMapping("/{id}")
    public ResponseEntity<Operacao> atualizar(@PathVariable Long id, @RequestBody OperacaoRequest request) {
        return ResponseEntity.ok(operacaoService.atualizar(id, request.solicitacaoId(), request.conteinerId(), request.responsavel(), request.andamento(), request.observacoes()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) { operacaoService.excluir(id); return ResponseEntity.noContent().build(); }

    // RF09 - Acompanhamento da operação
    @GetMapping
    public ResponseEntity<List<Operacao>> listarOperacoes() {
        return new ResponseEntity<>(operacaoService.listar(), HttpStatus.OK);
    }

    @PutMapping("/{id}/andamento")
    public ResponseEntity<Operacao> atualizarAndamento(
            @PathVariable Long id,
            @RequestParam String andamento,
            @RequestParam(required = false) String observacoes) {
        Operacao operacao = operacaoService.atualizarAndamento(id, andamento, observacoes);
        return new ResponseEntity<>(operacao, HttpStatus.OK);
    }
}

package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Servico;
import com.git.techocean.service.ServicoService;

@RestController
@RequestMapping("/servicos")
public class ServicoController {

    private final ServicoService servicoService;

    public ServicoController(ServicoService servicoService) {
        this.servicoService = servicoService;
    }

    // RF07 - Exibição do catálogo de serviços
    @GetMapping
    public ResponseEntity<List<Servico>> listarServicosDisponiveis() {
        return new ResponseEntity<>(servicoService.listarDisponiveis(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Servico> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(servicoService.buscarPorId(id), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<Servico> cadastrarServico(
            @RequestParam String nome,
            @RequestParam String descricao,
            @RequestParam String categoria,
            @RequestParam(required = false) Boolean disponivel) {
        Servico servico = servicoService.cadastrar(nome, descricao, categoria, disponivel);
        return new ResponseEntity<>(servico, HttpStatus.CREATED);
    }

    public record ServicoRequest(String nome, String descricao, String categoria, Boolean disponivel) {}

    @PostMapping(consumes = "application/json")
    public ResponseEntity<Servico> cadastrarJson(@RequestBody ServicoRequest request) {
        return new ResponseEntity<>(servicoService.cadastrar(request.nome(), request.descricao(), request.categoria(), request.disponivel()), HttpStatus.CREATED);
    }

    @GetMapping("/todos")
    public ResponseEntity<List<Servico>> listarTodos() { return ResponseEntity.ok(servicoService.listarTodos()); }

    @PutMapping("/{id}")
    public ResponseEntity<Servico> atualizar(@PathVariable Long id, @RequestBody ServicoRequest request) {
        return ResponseEntity.ok(servicoService.atualizar(id, request.nome(), request.descricao(), request.categoria(), request.disponivel()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) { servicoService.excluir(id); return ResponseEntity.noContent().build(); }
}

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
}
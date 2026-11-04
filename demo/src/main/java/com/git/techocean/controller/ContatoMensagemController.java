package com.git.techocean.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.git.techocean.model.ContatoMensagem;
import com.git.techocean.service.ContatoMensagemService;

@RestController
@RequestMapping("/mensagens/contatos")
public class ContatoMensagemController {

    private final ContatoMensagemService service;

    public ContatoMensagemController(ContatoMensagemService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ContatoMensagem> criar(@RequestBody ContatoMensagemRequest request) {
        ContatoMensagem contato = service.criar(request.nome(), request.email(), request.conteudo());
        return new ResponseEntity<>(contato, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ContatoMensagem>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @PutMapping("/{id}/resposta")
    public ResponseEntity<ContatoMensagem> responder(
            @PathVariable Long id,
            @RequestBody RespostaRequest request) {
        return ResponseEntity.ok(service.responder(id, request.resposta()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletar(@PathVariable Long id) {
        service.deletar(id);
        return ResponseEntity.ok(Map.of("message", "Mensagem deletada."));
    }

    public record ContatoMensagemRequest(String nome, String email, String conteudo) {
    }

    public record RespostaRequest(String resposta) {
    }
}

package com.git.techocean.controller;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Mensagem;
import com.git.techocean.service.MensagemService;

@RestController
@RequestMapping("/mensagens")
public class MensagemController {

    private final MensagemService mensagemService;

    public MensagemController(MensagemService mensagemService) {
        this.mensagemService = mensagemService;
    }

    // RF08 - Enviar mensagem ao atendimento
    @PostMapping
    public ResponseEntity<Mensagem> enviarMensagem(
            @RequestParam Long clienteId,
            @RequestParam(required = false) String especialista,
            @RequestParam String conteudo) {
        Mensagem mensagem = mensagemService.enviarMensagem(
                Objects.requireNonNull(clienteId, "clienteId não pode ser nulo"), especialista, conteudo);
        return new ResponseEntity<>(mensagem, HttpStatus.CREATED);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Mensagem>> listarPorCliente(@PathVariable Long clienteId) {
        return new ResponseEntity<>(
                mensagemService.listarPorCliente(Objects.requireNonNull(clienteId, "clienteId não pode ser nulo")),
                HttpStatus.OK);
    }

    @PutMapping("/{id}/resposta")
    public ResponseEntity<Mensagem> responder(
            @PathVariable Long id,
            @RequestBody Mensagem resposta) {
        Mensagem mensagem = mensagemService.responder(
                Objects.requireNonNull(id, "id não pode ser nulo"), resposta.getResposta());
        return new ResponseEntity<>(mensagem, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletarMensagem(@PathVariable Long id) {
        mensagemService.deletar(Objects.requireNonNull(id, "id não pode ser nulo"));
        return ResponseEntity.ok(Map.of("message", "Mensagem deletada."));
    }
}
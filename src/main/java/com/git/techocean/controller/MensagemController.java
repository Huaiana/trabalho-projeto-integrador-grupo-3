package com.git.techocean.controller;

import java.util.List;
import java.util.Map;
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
        Mensagem mensagem = mensagemService.enviarMensagem(clienteId, especialista, conteudo);
        return new ResponseEntity<>(mensagem, HttpStatus.CREATED);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Mensagem>> listarPorCliente(@PathVariable Long clienteId) {
        return new ResponseEntity<>(mensagemService.listarPorCliente(clienteId), HttpStatus.OK);
    }

    @PutMapping("/{id}/resposta")
    public ResponseEntity<Mensagem> responder(
            @PathVariable Long id,
            @RequestBody Mensagem resposta) {
        Mensagem mensagem = mensagemService.responder(id, resposta.getResposta());
        return new ResponseEntity<>(mensagem, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletar(@PathVariable Long id) {
        mensagemService.deletar(id);
        return ResponseEntity.ok(Map.of("message", "Mensagem deletada."));
    }
}
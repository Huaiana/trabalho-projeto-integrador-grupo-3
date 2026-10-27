package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Conteiner;
import com.git.techocean.service.ConteinerService;

@RestController
@RequestMapping("/conteineres")
public class ConteinerController {

    private final ConteinerService conteinerService;

    public ConteinerController(ConteinerService conteinerService) {
        this.conteinerService = conteinerService;
    }

    @PostMapping
    public ResponseEntity<Conteiner> cadastrar(
            @RequestParam String numeroConteiner,
            @RequestParam String tipo,
            @RequestParam String situacao) {
        Conteiner conteiner = conteinerService.cadastrar(numeroConteiner, tipo, situacao);
        return new ResponseEntity<>(conteiner, HttpStatus.CREATED);
    }

    public record ConteinerRequest(String numeroConteiner, String tipo, String situacao) {}

    @PostMapping(consumes = "application/json")
    public ResponseEntity<Conteiner> cadastrarJson(@RequestBody ConteinerRequest request) {
        return new ResponseEntity<>(conteinerService.cadastrar(request.numeroConteiner(), request.tipo(), request.situacao()), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Conteiner> atualizar(@PathVariable Long id, @RequestBody ConteinerRequest request) {
        return ResponseEntity.ok(conteinerService.atualizar(id, request.numeroConteiner(), request.tipo(), request.situacao()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) { conteinerService.excluir(id); return ResponseEntity.noContent().build(); }

    @GetMapping
    public ResponseEntity<List<Conteiner>> listarConteineres() {
        return new ResponseEntity<>(conteinerService.listar(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conteiner> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(conteinerService.buscarPorId(id), HttpStatus.OK);
    }
}

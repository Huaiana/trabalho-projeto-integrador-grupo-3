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

    @GetMapping
    public ResponseEntity<List<Conteiner>> listarConteineres() {
        return new ResponseEntity<>(conteinerService.listar(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conteiner> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(conteinerService.buscarPorId(id), HttpStatus.OK);
    }
}

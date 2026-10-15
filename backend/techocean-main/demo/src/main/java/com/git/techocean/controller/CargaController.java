package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Carga;
import com.git.techocean.service.CargaService;

@RestController
@RequestMapping("/cargas")
public class CargaController {

    private final CargaService cargaService;

    public CargaController(CargaService cargaService) {
        this.cargaService = cargaService;
    }

    // RF02 - Cadastrar especificações de carga
    @PostMapping
    public ResponseEntity<Carga> cadastrar(
            @RequestParam String descricao,
            @RequestParam Double peso,
            @RequestParam Double volume,
            @RequestParam String tipoCarga,
            @RequestParam String origem,
            @RequestParam String destino) {
        Carga carga = cargaService.cadastrar(descricao, peso, volume, tipoCarga, origem, destino);
        return new ResponseEntity<>(carga, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Carga>> listarCargas() {
        return new ResponseEntity<>(cargaService.listar(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Carga> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(cargaService.buscarPorId(id), HttpStatus.OK);
    }
}
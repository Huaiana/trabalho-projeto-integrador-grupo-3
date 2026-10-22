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
    public ResponseEntity<Carga> cadastrar(@RequestBody Carga dados) {
        Carga carga = cargaService.cadastrar(dados.getDescricao(), dados.getPeso(), dados.getVolume(),
                dados.getTipoCarga(), dados.getOrigem(), dados.getDestino());
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

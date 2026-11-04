package com.git.techocean.controller;

import java.util.List;
import java.util.Objects;
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
        Long idObrigatorio = Objects.requireNonNull(id, "id não pode ser nulo");
        return new ResponseEntity<>(cargaService.buscarPorId(idObrigatorio), HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Carga> atualizar(@PathVariable Long id, @RequestBody Carga dados) {
        Long idObrigatorio = Objects.requireNonNull(id, "id não pode ser nulo");
        Carga carga = cargaService.atualizar(idObrigatorio, dados.getDescricao(), dados.getPeso(), dados.getVolume(),
                dados.getTipoCarga(), dados.getOrigem(), dados.getDestino());
        return ResponseEntity.ok(carga);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Long idObrigatorio = Objects.requireNonNull(id, "id não pode ser nulo");
        cargaService.excluir(idObrigatorio);
        return ResponseEntity.noContent().build();
    }
}

package com.git.techocean.controller;

import com.git.techocean.service.SolicitacaoCompartilhadaService;
import com.git.techocean.service.SolicitacaoCompartilhadaService.Pedido;
import com.git.techocean.service.SolicitacaoCompartilhadaService.Resultado;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/solicitacoes/compartilhadas")
public class SolicitacaoCompartilhadaController {
    private final SolicitacaoCompartilhadaService service;

    public SolicitacaoCompartilhadaController(SolicitacaoCompartilhadaService service) {
        this.service = service;
    }
    @GetMapping
    public List<Resultado> listar() { return service.listar(); }

    @PostMapping
    public ResponseEntity<Resultado> criar(@RequestBody Pedido pedido) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(pedido));
    }

    @PutMapping("/{id}")
    public Resultado atualizar(@PathVariable Long id, @RequestBody Pedido pedido) {
        return service.atualizar(id, pedido);
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<java.util.Map<String, String>> erro(org.springframework.web.server.ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(java.util.Map.of("message", java.util.Objects.requireNonNullElse(error.getReason(), "Erro ao salvar solicitação.")));
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<java.util.Map<String, String>> conflito() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "A solicitação foi alterada. Atualize e tente novamente."));
    }
}

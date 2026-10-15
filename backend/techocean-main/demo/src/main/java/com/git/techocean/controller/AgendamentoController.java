package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Agendamento;
import com.git.techocean.service.AgendamentoService;
import com.git.techocean.service.AgendamentoException;

@RestController
@RequestMapping("/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    @PostMapping
    public ResponseEntity<Agendamento> solicitarVisita(@RequestBody Agendamento request) {
        Agendamento agendamento = agendamentoService.solicitarVisita(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(agendamento);
    }

    @GetMapping
    public ResponseEntity<List<Agendamento>> listarTodos() {
        return new ResponseEntity<>(agendamentoService.listar(), HttpStatus.OK);
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Agendamento>> listarPorCliente(@PathVariable Long clienteId) {
        return new ResponseEntity<>(agendamentoService.listarPorCliente(clienteId), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agendamento> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(agendamentoService.buscarPorId(id), HttpStatus.OK);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Agendamento> atualizarStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        Agendamento agendamento = agendamentoService.atualizarStatus(id, status);
        return new ResponseEntity<>(agendamento, HttpStatus.OK);
    }

    @ExceptionHandler(AgendamentoException.class)
    public ResponseEntity<ApiError> handleRequestError(AgendamentoException exception) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ApiError(exception.getCode(), exception.getMessage()));
    }

    public record ApiError(String code, String message) {
    }
}
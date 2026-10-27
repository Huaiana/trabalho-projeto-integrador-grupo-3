package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Agendamento;
import com.git.techocean.model.Usuario;
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

    /** Protected team flow; requires an existing customer account and does not request that customer's password. */
    @PostMapping("/gerenciamento")
    public ResponseEntity<AgendamentoDto> criarPelaEquipe(@RequestBody AgendamentoEquipeRequest request) {
        Agendamento agendamento = agendamentoService.criarPelaEquipe(
                request.usuarioId(), request.telefone(), request.dataHora(), request.confirmado());
        return ResponseEntity.status(HttpStatus.CREATED).body(AgendamentoDto.from(agendamento));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioResumo>> listarUsuariosParaAgendamento() {
        return ResponseEntity.ok(agendamentoService.listarUsuariosParaAgendamento().stream()
                .map(UsuarioResumo::from).toList());
    }

    @GetMapping
    public ResponseEntity<List<AgendamentoDto>> listarTodos() {
        return ResponseEntity.ok(agendamentoService.listar().stream().map(AgendamentoDto::from).toList());
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<AgendamentoDto>> listarPorCliente(@PathVariable Long clienteId) {
        return ResponseEntity.ok(agendamentoService.listarPorCliente(clienteId).stream().map(AgendamentoDto::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AgendamentoDto> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(AgendamentoDto.from(agendamentoService.buscarPorId(id)));
    }

    /** Team-only edit; a null usuarioId preserves the existing customer. */
    @PutMapping("/{id}")
    public ResponseEntity<AgendamentoDto> atualizarPelaEquipe(
            @PathVariable Long id,
            @RequestBody AgendamentoEquipeRequest request) {
        Agendamento agendamento = agendamentoService.atualizarPelaEquipe(
                id, request.usuarioId(), request.telefone(), request.dataHora(), request.confirmado());
        return ResponseEntity.ok(AgendamentoDto.from(agendamento));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        agendamentoService.excluir(id);
        return ResponseEntity.noContent().build();
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

    public record AgendamentoEquipeRequest(Long usuarioId, String telefone,
            java.time.LocalDateTime dataHora, Boolean confirmado) {
    }

    public record AgendamentoDto(Long id, Long usuarioId, String nome, String email,
            String telefone, java.time.LocalDateTime dataHora, boolean status) {
        static AgendamentoDto from(Agendamento agendamento) {
            Usuario usuario = agendamento.getUsuario();
            return new AgendamentoDto(agendamento.getId(), usuario == null ? null : usuario.getId(),
                    usuario == null ? agendamento.getNome() : usuario.getNome(),
                    usuario == null ? agendamento.getEmail() : usuario.getEmail(),
                    agendamento.getTelefone(), agendamento.getDataHora(), agendamento.isStatus());
        }
    }

    public record UsuarioResumo(Long id, String nome, String email, String cpfCnpj) {
        static UsuarioResumo from(Usuario usuario) {
            return new UsuarioResumo(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getCPFCNPJ());
        }
    }
}

package com.git.techocean.controller;

import com.git.techocean.model.ReferenciaCompartilhada;
import com.git.techocean.repository.ReferenciaCompartilhadaRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/referencias-compartilhadas")
public class ReferenciasCompartilhadasController {
    private static final Set<String> TIPOS = Set.of("SRV", "CRG", "CTR", "OPR", "ORC");
    private final ReferenciaCompartilhadaRepository referencias;
    private final UsuarioAdminRepository usuarios;

    public ReferenciasCompartilhadasController(ReferenciaCompartilhadaRepository referencias, UsuarioAdminRepository usuarios) {
        this.referencias = referencias;
        this.usuarios = usuarios;
    }

    @GetMapping
    public List<ReferenciaCompartilhada> listar() {
        return referencias.findAll();
    }

    @GetMapping("/prestadores")
    public List<Prestador> prestadores() {
        return usuarios.findAll().stream()
                .map(u -> new Prestador(u.getId(), u.getNome(), u.getCargo())).toList();
    }

    @PostMapping
    public ResponseEntity<ReferenciaCompartilhada> criar(@RequestBody ReferenciaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salvar(new ReferenciaCompartilhada(), request));
    }

    @PutMapping("/{id}")
    public ReferenciaCompartilhada atualizar(@PathVariable Long id, @RequestBody ReferenciaRequest request) {
        ReferenciaCompartilhada referencia = referencias.findById(java.util.Objects.requireNonNull(id))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Referência não encontrada."));
        if (!referencia.getTipo().equals(request.tipo())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O tipo da referência não pode ser alterado.");
        }
        if (!java.util.Objects.equals(referencia.getVersao(), request.versao())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A referência foi alterada. Atualize e tente novamente.");
        }
        return salvar(referencia, request);
    }

    private ReferenciaCompartilhada salvar(ReferenciaCompartilhada referencia, ReferenciaRequest request) {
        if (request.tipo() == null || !TIPOS.contains(request.tipo()) || request.nome() == null || request.nome().isBlank()
                || request.nome().length() > 255 || (request.categoria() != null && request.categoria().length() > 255)
                || (request.descricao() != null && request.descricao().length() > 2000)
                || (request.valor() != null && (request.valor().signum() < 0 || request.valor().scale() > 2
                    || request.valor().precision() - request.valor().scale() > 13))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da referência inválidos.");
        }
        referencia.setTipo(request.tipo());
        referencia.setNome(request.nome().trim());
        referencia.setCategoria(request.categoria());
        referencia.setDescricao(request.descricao());
        referencia.setValor(request.valor());
        return referencias.saveAndFlush(referencia);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<java.util.Map<String, String>> erro(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(java.util.Map.of("message", java.util.Objects.requireNonNullElse(error.getReason(), "Erro ao salvar referência.")));
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<java.util.Map<String, String>> conflito() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(java.util.Map.of("message", "A referência foi alterada. Atualize e tente novamente."));
    }

    public record ReferenciaRequest(String tipo, String nome, String categoria, String descricao, BigDecimal valor, Long versao) {}
    public record Prestador(Long id, String nome, String cargo) {}
}

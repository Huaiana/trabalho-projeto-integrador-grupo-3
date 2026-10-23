package com.git.techocean.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.Cliente;
import com.git.techocean.service.ClienteService;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // RF01 - Cadastrar cliente
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Cliente> cadastrar(@RequestBody CadastroClienteRequest request) {
        Cliente cliente = clienteService.cadastrar(
                request.nome(), request.cpf(), request.telefone(), request.email(), request.senha());
        return new ResponseEntity<>(cliente, HttpStatus.CREATED);
    }

    @PostMapping(params = {"nome", "cpfcnpj", "telefone", "email", "senha"})
    public ResponseEntity<Cliente> cadastrarPorParametros(
            @RequestParam String nome,
            @RequestParam String cpfcnpj,
            @RequestParam String telefone,
            @RequestParam String email,
            @RequestParam String senha) {
        Cliente cliente = clienteService.cadastrar(nome, cpfcnpj, telefone, email, senha);
        return new ResponseEntity<>(cliente, HttpStatus.CREATED);
    }

    // RF02 - Login de cliente
    @PostMapping("/login")
    public ResponseEntity<Cliente> loginCliente(@RequestBody Cliente cliente) {
        Cliente clienteEncontrado = clienteService.autenticar(cliente.getEmail(), cliente.getSenha());
        if (clienteEncontrado != null) {
            return new ResponseEntity<>(clienteEncontrado, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
    }

    // RF21 - Listar todos os clientes
    @GetMapping
    public ResponseEntity<List<Cliente>> listarClientes() {
        return new ResponseEntity<>(clienteService.listar(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return new ResponseEntity<>(clienteService.buscarPorId(id), HttpStatus.OK);
    }

    // RF22 - Editar ou atualizar dados de cliente
    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizarCliente(@PathVariable Long id, @RequestBody AtualizarClienteRequest request) {
        Cliente cliente = clienteService.atualizar(id, request.nome(), request.cpf(), request.telefone(), request.email(), request.senha());
        return new ResponseEntity<>(cliente, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirCliente(@PathVariable Long id) {
        clienteService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    public record CadastroClienteRequest(
            String nome,
            String cpf,
            String telefone,
            String email,
            String senha) {
    }

    public record AtualizarClienteRequest(String nome, String cpf, String telefone, String email, String senha) {
    }
}

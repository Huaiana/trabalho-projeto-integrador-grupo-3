package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Cliente;
import com.git.techocean.repository.ClienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    public ClienteService(ClienteRepository clienteRepository, PasswordEncoder passwordEncoder) {
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public ClienteService(ClienteRepository clienteRepository) {
        this(clienteRepository, new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder());
    }

    public Cliente cadastrar(String nome, String cpfCnpj, String telefone, String email, String senha) {
        validarCamposObrigatorios(nome, cpfCnpj, telefone, email, senha);
        
        if (clienteRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }

        return clienteRepository.save(new Cliente(nome, cpfCnpj, telefone, email, passwordEncoder.encode(senha)));
    }

    public Cliente autenticar(String email, String senha) {
        Cliente cliente = clienteRepository.findByEmail(email);
        if (cliente == null || senha == null || cliente.getSenha() == null) return null;
        if (cliente.getSenha().startsWith("$2")) return passwordEncoder.matches(senha, cliente.getSenha()) ? cliente : null;
        if (cliente.getSenha().equals(senha)) {
            cliente.setSenha(passwordEncoder.encode(senha)); return clienteRepository.save(cliente);
        }
        return null;
    }

    public List<Cliente> listar() {
        return clienteRepository.findAll();
    }

    public Cliente buscarPorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente " + id + " não encontrado"));
    }

    private void validarCamposObrigatorios(
            String nome, String cpfCnpj, String telefone, String email, String senha) {
        if (nome == null || nome.trim().isEmpty()) throw erro("O campo 'nome' é obrigatório.");
        if (cpfCnpj == null || cpfCnpj.trim().isEmpty()) throw erro("O campo 'cpfCnpj' é obrigatório.");
        if (telefone == null || telefone.trim().isEmpty()) throw erro("O campo 'telefone' é obrigatório.");
        if (email == null || email.trim().isEmpty()) throw erro("O campo 'email' é obrigatório.");
        if (senha == null || senha.trim().isEmpty()) throw erro("O campo 'senha' é obrigatório.");
    }

    private ResponseStatusException erro(String mensagem) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
    }
}

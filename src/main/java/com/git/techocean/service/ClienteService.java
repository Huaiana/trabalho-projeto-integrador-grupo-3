package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Autowired;

import com.git.techocean.model.Cliente;
import com.git.techocean.repository.ClienteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
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

    @Transactional
    public Cliente atualizar(Long id, String nome, String cpfCnpj, String telefone, String email, String senha) {
        if (nome == null || nome.isBlank()) throw erro("O campo 'nome' é obrigatório.");
        if (cpfCnpj == null || cpfCnpj.isBlank()) throw erro("O campo 'cpf' é obrigatório.");
        if (telefone == null || telefone.isBlank()) throw erro("O campo 'telefone' é obrigatório.");
        if (email == null || email.isBlank()) throw erro("O campo 'email' é obrigatório.");

        Cliente cliente = buscarPorId(id);
        String emailNormalizado = email.trim().toLowerCase(java.util.Locale.ROOT);
        Cliente donoDoEmail = clienteRepository.findByEmail(emailNormalizado);
        if (donoDoEmail != null && !donoDoEmail.getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }

        cliente.setNome(nome.trim());
        cliente.setCPFCNPJ(cpfCnpj.trim());
        cliente.setTelefone(telefone.trim());
        cliente.setEmail(emailNormalizado);
        if (senha != null && !senha.isBlank()) {
            if (senha.length() < 8) throw erro("A senha precisa ter pelo menos 8 caracteres.");
            cliente.setSenha(passwordEncoder.encode(senha));
        }
        return clienteRepository.save(cliente);
    }

    @Transactional
    public void excluir(Long id) {
        Cliente cliente = buscarPorId(id);
        try {
            clienteRepository.delete(cliente);
            clienteRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O cliente possui solicitações, orçamentos ou mensagens vinculadas e não pode ser excluído.");
        }
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

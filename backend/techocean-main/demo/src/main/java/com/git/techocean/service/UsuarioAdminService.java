package com.git.techocean.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;

@Service
public class UsuarioAdminService {

    private final UsuarioAdminRepository usuarioAdminRepository;

    public UsuarioAdminService(UsuarioAdminRepository usuarioAdminRepository) {
        this.usuarioAdminRepository = usuarioAdminRepository;
    }

    public UsuarioAdmin cadastrar(String nome, String email, String senha, String cargo) {
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail do administrador é obrigatório.");
        }
        return usuarioAdminRepository.save(new UsuarioAdmin(nome, email, senha, cargo));
    }

    public UsuarioAdmin login(String email, String senha) {
        UsuarioAdmin admin = usuarioAdminRepository.findByEmail(email);
        if (admin != null && admin.getSenha().equals(senha)) {
            return admin;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas.");
    }
}
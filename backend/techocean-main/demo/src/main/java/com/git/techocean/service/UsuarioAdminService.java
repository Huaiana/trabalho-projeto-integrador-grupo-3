package com.git.techocean.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.model.StaffRole;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UsuarioAdminService {

    private final UsuarioAdminRepository usuarioAdminRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioAdminService(UsuarioAdminRepository usuarioAdminRepository, PasswordEncoder passwordEncoder) {
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UsuarioAdmin cadastrar(String nome, String email, String senha, String cargo) {
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do usuário é obrigatório.");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail do administrador é obrigatório.");
        }
        if (senha == null || senha.length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha precisa ter pelo menos 8 caracteres.");
        }
        return usuarioAdminRepository.save(new UsuarioAdmin(nome, email.trim().toLowerCase(), passwordEncoder.encode(senha), normalizeRole(cargo)));
    }

    public UsuarioAdmin login(String email, String senha) {
        UsuarioAdmin admin = usuarioAdminRepository.findByEmail(email);
        if (admin != null && matchesAndUpgrade(admin, senha)) {
            try {
                String role = normalizeRole(admin.getCargo());
                if (!role.equals(admin.getCargo())) { admin.setCargo(role); usuarioAdminRepository.save(admin); }
                return admin;
            } catch (ResponseStatusException ignored) {
                // Legacy roles outside the supported set are never implicitly promoted.
            }
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas.");
    }

    private boolean matchesAndUpgrade(UsuarioAdmin user, String raw) {
        if (raw == null || user.getSenha() == null) return false;
        if (user.getSenha().startsWith("$2") && passwordEncoder.matches(raw, user.getSenha())) return true;
        if (!user.getSenha().startsWith("$2") && user.getSenha().equals(raw)) {
            user.setSenha(passwordEncoder.encode(raw)); usuarioAdminRepository.save(user); return true;
        }
        return false;
    }

    private String normalizeRole(String role) {
        try { return StaffRole.valueOf(role.trim().toUpperCase(java.util.Locale.ROOT)).name(); }
        catch (RuntimeException ex) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cargo inválido."); }
    }
}

package com.git.techocean.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.model.StaffRole;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.git.techocean.repository.AuthSessionRepository;
import java.time.Instant;

@Service
public class UsuarioAdminService {

    private final UsuarioAdminRepository usuarioAdminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthSessionRepository sessions;

    public UsuarioAdminService(UsuarioAdminRepository usuarioAdminRepository, PasswordEncoder passwordEncoder,
            AuthSessionRepository sessions) {
        this.usuarioAdminRepository = usuarioAdminRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
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
        String normalizedEmail = normalizeEmail(email);
        if (usuarioAdminRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        }
        return usuarioAdminRepository.save(new UsuarioAdmin(nome.trim(), normalizedEmail, passwordEncoder.encode(senha), normalizeRole(cargo)));
    }

    @Transactional
    public UsuarioAdmin bootstrap(String nome, String email, String senha) {
        UsuarioAdmin existing = usuarioAdminRepository.findByEmailIgnoreCase(normalizeEmail(email));
        if (existing == null) return cadastrar(nome, email, senha, StaffRole.ADMIN.name());
        validateInputs(nome, email, senha);
        existing.setNome(nome.trim()); existing.setEmail(normalizeEmail(email));
        existing.setSenha(passwordEncoder.encode(senha)); existing.setCargo(StaffRole.ADMIN.name());
        return usuarioAdminRepository.save(existing);
    }

    @Transactional
    public UsuarioAdmin atualizar(Long id, String nome, String email, String senha, String cargo, Long actorId) {
        UsuarioAdmin user = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (nome == null || nome.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome é obrigatório.");
        String normalizedEmail = normalizeEmail(email);
        if (usuarioAdminRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado.");
        String normalizedRole = cargo == null ? normalizeRole(user.getCargo()) : normalizeRole(cargo);
        if (actorId != null && actorId.equals(id) && !StaffRole.ADMIN.name().equals(normalizedRole))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é permitido remover seu próprio acesso de administrador.");
        if (StaffRole.ADMIN.name().equals(user.getCargo()) && !StaffRole.ADMIN.name().equals(normalizedRole)
                && usuarioAdminRepository.countAdmins() <= 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é possível remover o último administrador.");
        boolean credentialsChanged = !normalizedRole.equals(user.getCargo()) || (senha != null && !senha.isBlank());
        user.setNome(nome.trim()); user.setEmail(normalizedEmail); user.setCargo(normalizedRole);
        if (senha != null && !senha.isBlank()) {
            if (senha.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha precisa ter pelo menos 8 caracteres.");
            user.setSenha(passwordEncoder.encode(senha));
        }
        UsuarioAdmin updated = usuarioAdminRepository.save(user);
        if (credentialsChanged) revokeSessions(id);
        return updated;
    }

    @Transactional
    public void excluir(Long id, Long actorId) {
        UsuarioAdmin user = usuarioAdminRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado."));
        if (actorId != null && actorId.equals(id))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é possível excluir sua própria conta.");
        if (StaffRole.ADMIN.name().equals(user.getCargo()) && usuarioAdminRepository.countAdmins() <= 1)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é possível excluir o último administrador.");
        revokeSessions(id);
        usuarioAdminRepository.delete(user);
    }

    private void revokeSessions(Long actorId) {
        Instant now = Instant.now();
        var activeSessions = sessions.findAllByActorIdAndLoggedOutAtIsNull(actorId);
        activeSessions.forEach(session -> session.setLoggedOutAt(now));
        sessions.saveAll(activeSessions);
    }

    private void validateInputs(String nome, String email, String senha) {
        if (nome == null || nome.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome é obrigatório.");
        if (email == null || email.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail é obrigatório.");
        if (senha == null || senha.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha precisa ter pelo menos 8 caracteres.");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail é obrigatório.");
        return email.trim().toLowerCase(java.util.Locale.ROOT);
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

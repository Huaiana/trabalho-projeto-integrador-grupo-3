package com.git.techocean.controller;

import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.AuthSession;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.UsuarioAdminService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
import com.git.techocean.service.AdminBootstrapService;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/admin")
public class UsuarioAdminController {
    private final UsuarioAdminService service;
    private final UsuarioAdminRepository users;
    private final AuthSessionService sessions;
    private final AdminBootstrapService bootstrap;
    private final String setupToken;

    public UsuarioAdminController(UsuarioAdminService service, UsuarioAdminRepository users,
            AuthSessionService sessions, AdminBootstrapService bootstrap,
            @Value("${ADMIN_SETUP_TOKEN:}") String setupToken) {
        this.service = service; this.users = users; this.sessions = sessions; this.bootstrap = bootstrap;
        this.setupToken = "jsrT5m2KpGoPyZYW4NF74Eb3X7SHvK8JU6XAPeerQ2Y=";

    }

    @PostMapping("/setup")
    @Transactional
    public ResponseEntity<UserDto> setup(@RequestHeader(value = "X-Admin-Setup-Token", required = false) String provided,
            @RequestBody StaffRequest request) {
        if (setupToken.isBlank() || !constantTimeEquals(setupToken, provided) || users.countAdmins() != 0)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Setup indisponível.");
        try {
            bootstrap.reserve();
        } catch (DataIntegrityViolationException alreadyReserved) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Setup indisponível.");
        }
        UsuarioAdmin user = service.bootstrap(request.nome(), request.email(), request.senha());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.from(user));
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        UsuarioAdmin user = service.login(request.email(), request.senha());
        return new LoginResponse(sessions.start(user), UserDto.from(user));
    }

    @GetMapping("/me") public UserDto me(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt) {
        return users.findById(Long.valueOf(jwt.getSubject())).map(UserDto::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @PostMapping("/logout") public ResponseEntity<Void> logout(@org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt) {
        sessions.logout(jwt.getId()); return ResponseEntity.noContent().build();
    }

    @GetMapping("/usuarios") public List<UserDto> listUsers() { return users.findAll().stream().map(UserDto::from).toList(); }
    @PostMapping("/usuarios") public ResponseEntity<UserDto> createUser(@RequestBody StaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(UserDto.from(service.cadastrar(request.nome(), request.email(), request.senha(), request.cargo())));
    }
    @PutMapping("/usuarios/{id}") public UserDto updateUser(@PathVariable Long id, @RequestBody StaffUpdate request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt actor) {
        return UserDto.from(service.atualizar(id, request.nome(), request.email(), request.senha(), request.cargo(),
                Long.valueOf(actor.getSubject())));
    }
    @DeleteMapping("/usuarios/{id}") public ResponseEntity<Void> deleteUser(@PathVariable Long id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt actor) {
        service.excluir(id, Long.valueOf(actor.getSubject())); return ResponseEntity.noContent().build();
    }

    @GetMapping("/auditoria") public List<AuditEvent> audit() { return sessions.auditEvents(); }
    @GetMapping("/sessoes") public List<SessionDto> activeSessions() {
        Instant now = Instant.now();
        return sessions.allSessions().stream().map(s -> new SessionDto(s.getId(), s.getActorId(), s.getActorName(), s.getRole(),
                s.getStartedAt(), s.getLastActivityAt(), s.getLoggedOutAt(),
                Duration.between(s.getStartedAt(), s.getLoggedOutAt() == null ? now : s.getLoggedOutAt()).toSeconds())).toList();
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) return false;
        return java.security.MessageDigest.isEqual(expected.getBytes(java.nio.charset.StandardCharsets.UTF_8), actual.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
    public record StaffRequest(String nome, String email, String senha, String cargo) { }
    public record StaffUpdate(String nome, String email, String senha, String cargo) { }
    public record LoginRequest(String email, String senha) { }
    public record UserDto(Long id, String nome, String email, String cargo) {
        static UserDto from(UsuarioAdmin user) { return new UserDto(user.getId(), user.getNome(), user.getEmail(), user.getCargo()); }
    }
    public record LoginResponse(String accessToken, UserDto user) { }
    public record SessionDto(String id, Long actorId, String actorName, String role, Instant startedAt, Instant lastActivityAt,
            Instant loggedOutAt, long durationSeconds) { }
}

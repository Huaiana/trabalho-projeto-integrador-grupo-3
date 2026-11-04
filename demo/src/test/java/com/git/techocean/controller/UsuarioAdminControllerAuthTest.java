package com.git.techocean.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.service.AdminBootstrapService;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.UsuarioAdminService;
import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.AuthSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.security.oauth2.jwt.Jwt;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class UsuarioAdminControllerAuthTest {
    private final UsuarioAdminService service = mock(UsuarioAdminService.class);
    private final UsuarioAdminRepository users = mock(UsuarioAdminRepository.class);
    private final AuthSessionService sessions = mock(AuthSessionService.class);
    private final AdminBootstrapService bootstrap = mock(AdminBootstrapService.class);
    private final UsuarioAdminController controller = new UsuarioAdminController(service, users, sessions, bootstrap, "onetime-test-token");

    @Test void setupCreatesOnlyFirstAdminWithSecretHeader() {
        when(users.countAdmins()).thenReturn(0L);
        when(bootstrap.reserve()).thenReturn(true);
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", "hash", "ADMIN");
        when(service.bootstrap("Admin", "admin@example.com", "strong-pass")).thenReturn(admin);
        var response = controller.setup("onetime-test-token",
                new UsuarioAdminController.StaffRequest("Admin", "admin@example.com", "strong-pass", null));
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> controller.setup("wrong",
                new UsuarioAdminController.StaffRequest("Other", "other@example.com", "strong-pass", null)));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatusCode());
        verify(bootstrap).reserve();
    }

    @Test void loginReturnsTokenAndSafeUserDto() {
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", "hash", "ADMIN");
        admin.setId(7L);
        when(service.login("admin@example.com", "strong-pass")).thenReturn(admin);
        when(sessions.start(admin)).thenReturn("jwt-value");
        var response = controller.login(new UsuarioAdminController.LoginRequest("admin@example.com", "strong-pass"));
        assertEquals("jwt-value", response.accessToken());
        assertEquals("ADMIN", response.user().cargo());
        assertFalse(response.user().toString().contains("hash"));
    }

    @Test void listsAndCreatesUsers() {
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", "hash", "ADMIN");
        admin.setId(7L);
        when(users.findAll()).thenReturn(List.of(admin));
        assertEquals(1, controller.listUsers().size());

        when(service.cadastrar("Staff", "staff@example.com", "strong-pass", "FUNCIONARIO")).thenReturn(admin);
        var response = controller.createUser(new UsuarioAdminController.StaffRequest(
                "Staff", "staff@example.com", "strong-pass", "FUNCIONARIO"));
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        verify(service).cadastrar("Staff", "staff@example.com", "strong-pass", "FUNCIONARIO");
    }

    @Test void updatesAndDeletesUsersUsingAuthenticatedActor() {
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", "hash", "ADMIN");
        admin.setId(7L);
        when(service.atualizar(7L, "Updated", "updated@example.com", "strong-pass", "ADMIN", 9L))
                .thenReturn(admin);
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none").subject("9").claim("jti", "session-9").build();

        var updated = controller.updateUser(7L,
                new UsuarioAdminController.StaffUpdate("Updated", "updated@example.com", "strong-pass", "ADMIN"), jwt);
        assertEquals(7L, updated.id());

        var response = controller.deleteUser(7L, jwt);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(service).excluir(7L, 9L);
    }

    @Test void readsCurrentUserAndLogsOutBySessionId() {
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", "hash", "ADMIN");
        admin.setId(7L);
        when(users.findById(7L)).thenReturn(Optional.of(admin));
        Jwt jwt = Jwt.withTokenValue("token").header("alg", "none").subject("7").claim("jti", "session-7").build();

        assertEquals(7L, controller.me(jwt).id());
        var response = controller.logout(jwt);
        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(sessions).logout("session-7");
    }

    @Test void returnsAuditEventsAndActiveSessionsWithDuration() {
        AuditEvent event = new AuditEvent();
        when(sessions.auditEvents()).thenReturn(List.of(event));
        assertEquals(1, controller.audit().size());

        Instant started = Instant.parse("2026-01-01T10:00:00Z");
        AuthSession session = new AuthSession();
        session.setId("session-7");
        session.setActorId(7L);
        session.setActorName("Admin");
        session.setRole("ADMIN");
        session.setStartedAt(started);
        session.setLastActivityAt(started.plusSeconds(30));
        session.setLoggedOutAt(started.plusSeconds(3600));
        when(sessions.allSessions()).thenReturn(List.of(session));

        assertEquals(3600L, controller.activeSessions().get(0).durationSeconds());
    }
}

package com.git.techocean.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.service.AdminBootstrapService;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.UsuarioAdminService;
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
        assertThrows(ResponseStatusException.class, () -> controller.setup("wrong",
                new UsuarioAdminController.StaffRequest("Other", "other@example.com", "strong-pass", null)));
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
}

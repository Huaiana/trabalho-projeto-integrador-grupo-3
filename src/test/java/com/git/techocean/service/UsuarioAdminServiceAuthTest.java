package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class UsuarioAdminServiceAuthTest {
    private final UsuarioAdminRepository repository = mock(UsuarioAdminRepository.class);
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    private final UsuarioAdminService service = new UsuarioAdminService(repository, encoder, sessions);

    @Test void hashesNewStaffPasswordsAndAcceptsSupportedRoles() {
        when(repository.save(any(UsuarioAdmin.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, UsuarioAdmin.class));
        UsuarioAdmin user = service.cadastrar("Rafa", "rafa@example.com", "s3nh4forte", "supervisor");
        assertEquals("SUPERVISOR", user.getCargo());
        assertTrue(encoder.matches("s3nh4forte", user.getSenha()));
    }

    @Test void migratesLegacyPasswordOnLoginAndRejectsUnknownLegacyRole() {
        UsuarioAdmin legacy = new UsuarioAdmin("Staff", "staff@example.com", "plaintext", "MANAGER");
        when(repository.findByEmailIgnoreCase("staff@example.com")).thenReturn(legacy);
        when(repository.save(any(UsuarioAdmin.class)))
                .thenAnswer(invocation -> invocation.getArgument(0, UsuarioAdmin.class));
        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> service.login("staff@example.com", "plaintext"));
        assertEquals("Credenciais inválidas.", exception.getReason());
        assertTrue(encoder.matches("plaintext", legacy.getSenha()));
        assertEquals("MANAGER", legacy.getCargo());
    }

    @Test void loginNormalizesEmailCaseAndWhitespace() {
        UsuarioAdmin admin = new UsuarioAdmin("Admin", "admin@example.com", encoder.encode("strong-pass"), "ADMIN");
        when(repository.findByEmailIgnoreCase("admin@example.com")).thenReturn(admin);

        assertSame(admin, service.login("  ADMIN@Example.COM  ", "strong-pass"));
    }
}

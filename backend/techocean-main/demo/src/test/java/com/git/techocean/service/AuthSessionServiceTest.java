package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.git.techocean.model.AuthSession;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;

class AuthSessionServiceTest {
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private final AuditEventRepository audits = mock(AuditEventRepository.class);
    private final JwtEncoder encoder = mock(JwtEncoder.class);
    private final AuthSessionService service = new AuthSessionService(sessions, audits, encoder, 30);

    @Test void createsSessionAndAccessTokenWithRole() {
        when(encoder.encode(any())).thenReturn(Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .claim("role", "SUPERVISOR").build());
        UsuarioAdmin user = new UsuarioAdmin("Rafa", "rafa@example.com", "hash", "SUPERVISOR");
        user.setId(14L);

        assertEquals("signed-token", service.start(user));
        verify(sessions).save(argThat(s -> s.getActorId().equals(14L) && s.getRole().equals("SUPERVISOR")
                && s.getStartedAt() != null && s.getLastActivityAt() != null));
    }

    @Test void touchUpdatesSessionAndLogoutRevokesIt() {
        AuthSession session = new AuthSession(); session.setId("sid"); session.setStartedAt(Instant.now());
        session.setLastActivityAt(Instant.now());
        when(sessions.findById("sid")).thenReturn(Optional.of(session));

        assertTrue(service.touch("sid"));
        service.logout("sid");
        assertNotNull(session.getLoggedOutAt());
        when(sessions.findById("sid")).thenReturn(Optional.of(session));
        assertFalse(service.touch("sid"));
    }
}

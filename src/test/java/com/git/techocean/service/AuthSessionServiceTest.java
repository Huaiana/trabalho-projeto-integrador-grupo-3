package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.git.techocean.model.AuthSession;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

class AuthSessionServiceTest {
    private final AuthSessionRepository sessions = mock(AuthSessionRepository.class);
    private final AuditEventRepository audits = mock(AuditEventRepository.class);
    private final UsuarioAdminRepository users = mock(UsuarioAdminRepository.class);
    private final JwtEncoder encoder = mock(JwtEncoder.class);
    private final AuthSessionService service = new AuthSessionService(sessions, audits, encoder, users, 30);

    @Test void createsSessionAndAccessTokenWithRole() {
        when(encoder.encode(any())).thenReturn(Jwt.withTokenValue("signed-token").header("alg", "HS256")
                .claim("role", "SUPERVISOR").build());
        UsuarioAdmin user = new UsuarioAdmin("Rafa", "rafa@example.com", "hash", "SUPERVISOR");
        user.setId(14L);

        assertEquals("signed-token", service.start(user));
        verify(sessions).save(argThat(s -> s.getActorId().equals(14L) && s.getRole().equals("SUPERVISOR")
                && s.getStartedAt() != null && s.getLastActivityAt() != null));
    }

    @Test void generatedBearerTokenCanBeValidatedWithTheConfiguredHmacKey() {
        byte[] keyBytes = new byte[32];
        Arrays.fill(keyBytes, (byte) 73);
        SecretKey key = new SecretKeySpec(keyBytes, "HmacSHA256");
        JwtEncoder realEncoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        AuthSessionService realService = new AuthSessionService(sessions, audits, realEncoder, users, 30);
        UsuarioAdmin user = new UsuarioAdmin("Rafa", "rafa@example.com", "hash", "SUPERVISOR");
        user.setId(21L);

        String token = realService.start(user);

        var decoded = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build().decode(token);
        assertEquals("21", decoded.getSubject());
        assertEquals("SUPERVISOR", decoded.getClaimAsString("role"));
        assertNotNull(decoded.getId());
    }

    @Test void touchUpdatesSessionAndLogoutRevokesIt() {
        AuthSession session = new AuthSession(); session.setId("sid"); session.setStartedAt(Instant.now());
        session.setActorId(14L); session.setRole("SUPERVISOR"); session.setLastActivityAt(Instant.now());
        UsuarioAdmin user = new UsuarioAdmin("Rafa", "rafa@example.com", "hash", "SUPERVISOR");
        user.setId(14L);
        when(sessions.findById("sid")).thenReturn(Optional.of(session));
        when(users.findById(14L)).thenReturn(Optional.of(user));

        assertTrue(service.touch("sid", 14L, "SUPERVISOR"));
        service.logout("sid");
        assertNotNull(session.getLoggedOutAt());
        when(sessions.findById("sid")).thenReturn(Optional.of(session));
        assertFalse(service.touch("sid", 14L, "SUPERVISOR"));
    }
}

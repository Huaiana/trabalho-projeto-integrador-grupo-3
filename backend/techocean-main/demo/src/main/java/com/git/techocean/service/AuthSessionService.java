package com.git.techocean.service;

import com.git.techocean.model.AuthSession;
import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class AuthSessionService {
    private final AuthSessionRepository sessions;
    private final AuditEventRepository audits;
    private final JwtEncoder encoder;
    private final long timeoutMinutes;

    public AuthSessionService(AuthSessionRepository sessions, AuditEventRepository audits, JwtEncoder encoder,
            @Value("${AUTH_INACTIVITY_TIMEOUT_MINUTES:30}") long timeoutMinutes) {
        this.sessions = sessions; this.audits = audits; this.encoder = encoder; this.timeoutMinutes = timeoutMinutes;
    }

    public String start(UsuarioAdmin user) {
        Instant now = Instant.now(); String id = UUID.randomUUID().toString();
        AuthSession session = new AuthSession(); session.setId(id); session.setActorId(user.getId());
        session.setActorName(user.getNome()); session.setRole(user.getCargo()); session.setStartedAt(now);
        session.setLastActivityAt(now); sessions.save(session);
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("techocean").issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(12))).subject(user.getId().toString())
                .id(id).claim("name", user.getNome()).claim("role", user.getCargo()).build();
        return encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public boolean touch(String id) {
        AuthSession session = sessions.findById(id).orElse(null);
        if (session == null || session.getLoggedOutAt() != null) return false;
        Instant now = Instant.now();
        if (session.getLastActivityAt().plus(Duration.ofMinutes(timeoutMinutes)).isBefore(now)) {
            session.setLoggedOutAt(now); sessions.save(session); return false;
        }
        session.setLastActivityAt(now); sessions.save(session); return true;
    }

    public void logout(String id) {
        sessions.findById(id).ifPresent(session -> { session.setLoggedOutAt(Instant.now()); sessions.save(session); });
    }

    public java.util.List<AuthSession> activeSessions() { return sessions.findAllByLoggedOutAtIsNull(); }
    public java.util.List<AuditEvent> auditEvents() { return audits.findAll(); }
}

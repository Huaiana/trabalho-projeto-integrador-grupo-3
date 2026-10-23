package com.git.techocean.service;

import com.git.techocean.model.AuthSession;
import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jose.jws.JwsHeader;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.stereotype.Service;

@Service
public class AuthSessionService {
    private final AuthSessionRepository sessions;
    private final AuditEventRepository audits;
    private final JwtEncoder encoder;
    private final UsuarioAdminRepository users;
    private final long timeoutMinutes;

    public AuthSessionService(AuthSessionRepository sessions, AuditEventRepository audits, JwtEncoder encoder,
            UsuarioAdminRepository users,
            @Value("${AUTH_INACTIVITY_TIMEOUT_MINUTES:30}") long timeoutMinutes) {
        this.sessions = sessions; this.audits = audits; this.encoder = encoder; this.users = users;
        this.timeoutMinutes = timeoutMinutes;
    }

    public String start(UsuarioAdmin user) {
        Instant now = Instant.now(); String id = UUID.randomUUID().toString();
        AuthSession session = new AuthSession(); session.setId(id); session.setActorId(user.getId());
        session.setActorName(user.getNome()); session.setRole(user.getCargo()); session.setStartedAt(now);
        session.setLastActivityAt(now); sessions.save(session);
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("techocean").issuedAt(now)
                .expiresAt(now.plus(Duration.ofHours(12))).subject(user.getId().toString())
                .id(id).claim("name", user.getNome()).claim("role", user.getCargo()).build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public boolean touch(String id, Long actorId, String tokenRole) {
        AuthSession session = sessions.findById(id).orElse(null);
        if (session == null || session.getLoggedOutAt() != null) return false;
        Instant now = Instant.now();
        if (session.getLastActivityAt().plus(Duration.ofMinutes(timeoutMinutes)).isBefore(now)) {
            session.setLoggedOutAt(session.getLastActivityAt().plus(Duration.ofMinutes(timeoutMinutes)));
            sessions.save(session); return false;
        }
        UsuarioAdmin actor = users.findById(actorId).orElse(null);
        if (actor == null || !normalizedRole(actor.getCargo()).equals(tokenRole)
                || !session.getRole().equals(tokenRole) || !session.getActorId().equals(actorId)) {
            session.setLoggedOutAt(now); sessions.save(session); return false;
        }
        session.setLastActivityAt(now); sessions.save(session); return true;
    }

    public void logout(String id) {
        sessions.findById(id).ifPresent(session -> { session.setLoggedOutAt(Instant.now()); sessions.save(session); });
    }

    public java.util.List<AuthSession> allSessions() {
        Instant now = Instant.now();
        var all = sessions.findAll();
        all.stream().filter(s -> s.getLoggedOutAt() == null
                && s.getLastActivityAt().plus(Duration.ofMinutes(timeoutMinutes)).isBefore(now))
                .forEach(s -> s.setLoggedOutAt(s.getLastActivityAt().plus(Duration.ofMinutes(timeoutMinutes))));
        sessions.saveAll(all);
        return all;
    }
    public java.util.List<AuditEvent> auditEvents() { return audits.findAll(); }

    private String normalizedRole(String role) {
        return role == null ? "" : role.trim().toUpperCase(java.util.Locale.ROOT);
    }
}

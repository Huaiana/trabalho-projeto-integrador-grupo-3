package com.git.techocean.config;

import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.AuthSession;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.service.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SessionAuditInterceptor implements HandlerInterceptor {
    private final AuthSessionService sessionService;
    private final AuthSessionRepository sessions;
    private final AuditEventRepository audits;
    public SessionAuditInterceptor(AuthSessionService sessionService, AuthSessionRepository sessions, AuditEventRepository audits) {
        this.sessionService = sessionService; this.sessions = sessions; this.audits = audits;
    }

    @Override public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwt) {
            String sid = jwt.getToken().getId();
            if (sid == null || !sessionService.touch(sid)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); return false;
            }
            request.setAttribute("authSessionId", sid);
        }
        return true;
    }

    @Override public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Object sid = request.getAttribute("authSessionId");
        AuthSession session = sid == null ? null : sessions.findById(sid.toString()).orElse(null);
        AuditEvent event = new AuditEvent();
        if (session != null) {
            event.setActorId(session.getActorId()); event.setActorName(session.getActorName()); event.setActorRole(session.getRole());
        }
        String method = request.getMethod(); String uri = request.getRequestURI();
        event.setAction(method); event.setMethod(method); event.setResource(uri);
        String[] segments = uri.split("/"); event.setResourceId(segments.length > 0 ? segments[segments.length - 1] : null);
        event.setOccurredAt(Instant.now()); event.setResponseStatus(response.getStatus()); event.setIpAddress(request.getRemoteAddr());
        audits.save(event);
    }
}

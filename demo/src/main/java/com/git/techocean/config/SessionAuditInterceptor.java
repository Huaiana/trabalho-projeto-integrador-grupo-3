package com.git.techocean.config;

import com.git.techocean.model.AuditEvent;
import com.git.techocean.model.AuthSession;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.service.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
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

    @Override public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwt) {
            String sid = jwt.getToken().getId();
            Long actorId;
            try { actorId = Long.valueOf(jwt.getToken().getSubject()); }
            catch (RuntimeException invalidSubject) { actorId = null; }
            if (sid == null || actorId == null || !sessionService.touch(sid, actorId, jwt.getToken().getClaimAsString("role"))) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); return false;
            }
            request.setAttribute("authSessionId", sid);
        }
        return true;
    }

    @Override public void afterCompletion(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler, @Nullable Exception ex) {
        Object sid = request.getAttribute("authSessionId");
        AuthSession session = sid instanceof String sessionId ? sessions.findById(sessionId).orElse(null) : null;
        AuditEvent event = new AuditEvent();
        if (session != null) {
            event.setSessionId(session.getId()); event.setActorId(session.getActorId());
            event.setActorName(session.getActorName()); event.setActorRole(session.getRole());
        }
        String method = request.getMethod(); String uri = request.getRequestURI();
        ActionMetadata metadata = actionMetadata(method, uri);
        event.setEventCode("EVT-" + java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd-HHmmssSSS")
                .format(java.time.LocalDateTime.now()) + "-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        event.setAction(method); event.setActionCode(metadata.code()); event.setActionDescription(metadata.description());
        event.setMethod(method); event.setResource(uri);
        String[] segments = uri.split("/"); event.setResourceId(segments.length > 0 ? segments[segments.length - 1] : null);
        event.setOccurredAt(Instant.now()); event.setResponseStatus(response.getStatus()); event.setIpAddress(request.getRemoteAddr());
        audits.save(event);
    }

    private ActionMetadata actionMetadata(String method, String uri) {
        if ("POST".equals(method) && "/admin/login".equals(uri)) return new ActionMetadata("AUTH-001", "Login administrativo");
        if ("POST".equals(method) && "/admin/logout".equals(uri)) return new ActionMetadata("AUTH-002", "Encerramento de sessão");
        if ("POST".equals(method) && "/admin/setup".equals(uri)) return new ActionMetadata("ADM-001", "Criação do administrador inicial");
        if (uri.startsWith("/admin/usuarios")) {
            return switch (method) {
                case "POST" -> new ActionMetadata("ADM-002", "Criação de usuário administrativo");
                case "PUT" -> new ActionMetadata("ADM-003", "Atualização de usuário administrativo");
                case "DELETE" -> new ActionMetadata("ADM-004", "Exclusão de usuário administrativo");
                default -> new ActionMetadata("ADM-005", "Consulta de usuários administrativos");
            };
        }
        if ("POST".equals(method) && "/api/backup/admin/completo".equals(uri)) return new ActionMetadata("BKP-001", "Geração de backup administrativo completo");
        if ("POST".equals(method) && "/api/backup/operacional".equals(uri)) return new ActionMetadata("BKP-002", "Geração de backup operacional");
        if ("GET".equals(method) && "/admin/auditoria".equals(uri)) return new ActionMetadata("AUD-001", "Consulta do histórico de auditoria");
        if ("GET".equals(method) && "/admin/sessoes".equals(uri)) return new ActionMetadata("AUD-002", "Consulta de sessões administrativas");
        return genericActionMetadata(method, uri);
    }

    private ActionMetadata genericActionMetadata(String method, String uri) {
        String[] resource = switch (uri.startsWith("/") ? uri.substring(1).split("/") [0] : "") {
            case "cargas" -> new String[] {"CARGA", "cargas"};
            case "clientes" -> new String[] {"CLI", "clientes"};
            case "conteineres" -> new String[] {"CNT", "contêineres"};
            case "operacoes" -> new String[] {"OPR", "operações"};
            case "orcamentos" -> new String[] {"ORC", "orçamentos"};
            case "servicos" -> new String[] {"SRV", "serviços"};
            case "solicitacoes" -> new String[] {"SOL", "solicitações"};
            case "agendamentos" -> new String[] {"AGD", "agendamentos"};
            case "mensagens" -> new String[] {"MSG", "mensagens"};
            default -> new String[] {"SYS", "operação no sistema"};
        };
        String[] action = switch (method) {
            case "GET" -> new String[] {"001", "Consulta de "};
            case "POST" -> new String[] {"002", "Criação de "};
            case "PUT", "PATCH" -> new String[] {"003", "Atualização de "};
            case "DELETE" -> new String[] {"004", "Exclusão de "};
            default -> new String[] {"999", "Execução de "};
        };
        return new ActionMetadata(resource[0] + "-" + action[0], action[1] + resource[1]);
    }

    private record ActionMetadata(String code, String description) { }
}

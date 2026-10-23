package com.git.techocean.config;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.service.AuthSessionService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class SessionAuditInterceptorTest {
    @Test void recordsRequestMetadataAndResponseWithoutReadingBody() throws Exception {
        AuditEventRepository auditEvents = mock(AuditEventRepository.class);
        SessionAuditInterceptor interceptor = new SessionAuditInterceptor(
                mock(AuthSessionService.class), mock(AuthSessionRepository.class), auditEvents);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/mensagens/contatos");
        request.setRemoteAddr("192.0.2.4");
        request.setContent("sensitive request body".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse(); response.setStatus(201);

        interceptor.afterCompletion(request, response, new Object(), null);

        verify(auditEvents).save(argThat(event -> event.getActorId() == null
                && event.getMethod().equals("POST") && event.getAction().equals("POST")
                && event.getResource().equals("/mensagens/contatos") && event.getResponseStatus() == 201
                && event.getIpAddress().equals("192.0.2.4") && event.getOccurredAt() != null));
    }
}

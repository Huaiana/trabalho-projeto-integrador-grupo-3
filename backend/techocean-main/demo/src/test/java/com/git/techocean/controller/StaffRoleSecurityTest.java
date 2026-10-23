package com.git.techocean.controller;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.git.techocean.config.SecurityConfig;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.UsuarioAdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(UsuarioAdminController.class)
@Import(SecurityConfig.class)
class StaffRoleSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean UsuarioAdminService service;
    @MockBean UsuarioAdminRepository users;
    @MockBean AuthSessionService sessions;
    @MockBean AuthSessionRepository sessionRepository;
    @MockBean AuditEventRepository auditRepository;

    @Test void supervisorCannotReadAdminAudit() throws Exception {
        mvc.perform(get("/admin/auditoria").with(jwt().jwt(token -> token.claim("role", "SUPERVISOR"))))
                .andExpect(status().isForbidden());
        verifyNoInteractions(sessions);
    }

    @Test void funcionarioCannotDeleteOperationalResources() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/cargas/1")
                        .with(jwt().jwt(token -> token.claim("role", "FUNCIONARIO"))))
                .andExpect(status().isForbidden());
    }
}

package com.git.techocean.controller;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.git.techocean.config.SecurityConfig;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.repository.AuthSessionRepository;
import com.git.techocean.repository.AuditEventRepository;
import com.git.techocean.service.AdminBootstrapService;
import com.git.techocean.service.ClienteService;
import com.git.techocean.service.ServicoService;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.UsuarioAdminService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({UsuarioAdminController.class, ClienteController.class, ServicoController.class})
@Import(SecurityConfig.class)
class StaffRoleSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean UsuarioAdminService service;
    @MockBean UsuarioAdminRepository users;
    @MockBean AuthSessionService sessions;
    @MockBean AuthSessionRepository sessionRepository;
    @MockBean AuditEventRepository auditRepository;
    @MockBean AdminBootstrapService bootstrap;
    @MockBean ClienteService clientes;
    @MockBean ClienteRepository clienteRepository;
    @MockBean ServicoService servicos;

    @Test void supervisorCannotReadAdminAudit() throws Exception {
        mvc.perform(get("/admin/auditoria").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPERVISOR"))))
                .andExpect(status().isForbidden());
        verifyNoInteractions(sessions);
    }

    @Test void funcionarioCannotDeleteOperationalResources() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/cargas/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"))))
                .andExpect(status().isForbidden());
    }

    @Test void funcionarioCanReadClientOperationalData() throws Exception {
        org.mockito.Mockito.when(clientes.listar()).thenReturn(List.of());
        org.mockito.Mockito.when(sessions.touch("test-session", 7L, "FUNCIONARIO")).thenReturn(true);
        mvc.perform(get("/clientes").with(jwt().jwt(token -> token.subject("7").claim("jti", "test-session").claim("role", "FUNCIONARIO"))
                        .authorities(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"))))
                .andExpect(status().isOk());
    }

    @Test void anonymousCannotReadClientData() throws Exception {
        mvc.perform(get("/clientes")).andExpect(status().isUnauthorized());
    }

    @Test void publicServiceCatalogRemainsAvailableWithoutLogin() throws Exception {
        org.mockito.Mockito.when(servicos.listarDisponiveis()).thenReturn(List.of());
        mvc.perform(get("/servicos")).andExpect(status().isOk());
    }
}

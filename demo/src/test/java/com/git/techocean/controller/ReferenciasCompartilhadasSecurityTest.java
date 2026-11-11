package com.git.techocean.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.git.techocean.config.SecurityConfig;
import com.git.techocean.config.SessionAuditInterceptor;
import com.git.techocean.repository.ReferenciaCompartilhadaRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import com.git.techocean.service.AuthSessionService;
import com.git.techocean.service.SolicitacaoCompartilhadaService;
import com.git.techocean.service.SolicitacaoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest({ReferenciasCompartilhadasController.class, SolicitacaoCompartilhadaController.class, SolicitacaoController.class})
@Import(SecurityConfig.class)
@SuppressWarnings("null")
class ReferenciasCompartilhadasSecurityTest {
    @Autowired MockMvc mvc;
    @MockitoBean ReferenciaCompartilhadaRepository referencias;
    @MockitoBean UsuarioAdminRepository usuarios;
    @MockitoBean AuthSessionService sessions;
    @MockitoBean SessionAuditInterceptor audit;
    @MockitoBean SolicitacaoCompartilhadaService solicitacoesCompartilhadas;
    @MockitoBean SolicitacaoService solicitacoes;

    @BeforeEach void preparar() throws Exception {
        doReturn(true).when(audit).preHandle(any(), any(), any());
    }

    @Test void escritaDoCatalogoExigeAdministrador() throws Exception {
        String body = "{\"tipo\":\"SRV\",\"nome\":\"Teste\"}";
        mvc.perform(post("/referencias-compartilhadas").contentType(MediaType.APPLICATION_JSON).content(body)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"))))
                .andExpect(status().isForbidden());
        mvc.perform(put("/referencias-compartilhadas/1").contentType(MediaType.APPLICATION_JSON).content(body)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_SUPERVISOR"))))
                .andExpect(status().isForbidden());
        mvc.perform(get("/referencias-compartilhadas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/referencias-compartilhadas").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"))))
                .andExpect(status().isOk());
        org.mockito.Mockito.when(referencias.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        mvc.perform(post("/referencias-compartilhadas").contentType(MediaType.APPLICATION_JSON).content(body)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isCreated());
    }

    @Test void aceitaSolicitacaoJsonCompartilhadaSemAlterarRotaAntiga() throws Exception {
        var funcionario = jwt().authorities(new SimpleGrantedAuthority("ROLE_FUNCIONARIO"));
        mvc.perform(post("/solicitacoes/compartilhadas").contentType(MediaType.APPLICATION_JSON).with(funcionario)
                .content("""
                    {"clienteId":1,"cargaOperacionalId":2,"servicoOperacionalId":3,
                     "nomeServico":"Pedido","categoria":"Operações e Navios","descricao":"Resumo",
                     "servicoReferenciaId":4,"valor":12.50,"prestadorId":5,"statusSolicitacao":"EM_ANALISE"}
                    """)).andExpect(status().isCreated());
        var captor = org.mockito.ArgumentCaptor.forClass(SolicitacaoCompartilhadaService.Pedido.class);
        org.mockito.Mockito.verify(solicitacoesCompartilhadas).criar(captor.capture());
        org.junit.jupiter.api.Assertions.assertEquals(4L, captor.getValue().servicoReferenciaId());
        org.junit.jupiter.api.Assertions.assertEquals("EM_ANALISE", captor.getValue().statusSolicitacao());
        mvc.perform(get("/solicitacoes").with(funcionario)).andExpect(status().isOk());
        org.mockito.Mockito.verify(solicitacoes).listar();
        mvc.perform(get("/solicitacoes/compartilhadas")).andExpect(status().isUnauthorized());
    }
}

package com.git.techocean.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doReturn;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.git.techocean.config.CorsConfig;
import com.git.techocean.config.SecurityConfig;
import com.git.techocean.config.SessionAuditInterceptor;
import com.git.techocean.model.Carga;
import com.git.techocean.service.CargaService;
import com.git.techocean.service.AuthSessionService;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.TestPropertySource;
import java.util.List;

@WebMvcTest(CargaController.class)
@Import({CorsConfig.class, SecurityConfig.class})
@TestPropertySource(properties = "CORS_ALLOWED_ORIGIN_PATTERNS=https://extra-origin.example,https://techocean-web.pages.dev")
@SuppressWarnings("null")
class CargaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CargaService cargaService;
    @MockitoBean
    private AuthSessionService sessions;
    @MockitoBean
    private SessionAuditInterceptor sessionAuditInterceptor;

    @SuppressWarnings({"unused", "null"})
    @BeforeEach
    void permitMockedAuditInterceptor() throws Exception {
        doReturn(true).when(sessionAuditInterceptor).preHandle(any(), any(), any());
    }

    @Test
    void cadastrarAcceptsJsonRequestBody() throws Exception {
        Carga carga = new Carga("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife");
        when(cargaService.cadastrar("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife"))
                .thenReturn(carga);
        when(sessions.touch("test-session", 1L, "ADMIN")).thenReturn(true);

        mockMvc.perform(post("/cargas")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(token -> token.subject("1").claim("jti", "test-session").claim("role", "ADMIN"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .content("""
                                {"descricao":"Bobinas de aço","peso":24.5,"volume":12.8,
                                 "tipoCarga":"Bobinas","origem":"Santos","destino":"Recife"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descricao").value("Bobinas de aço"))
                .andExpect(jsonPath("$.destino").value("Recife"));

        verify(cargaService).cadastrar("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife");
    }

    @Test
    void allowsConfiguredSiteOriginEvenWhenAnExtraCorsOriginIsConfigured() throws Exception {
        String siteOrigin = "https://techocean-web.pages.dev";

        mockMvc.perform(options("/cargas")
                        .header(HttpHeaders.ORIGIN, siteOrigin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, siteOrigin));
    }

    @Test
    void listsLoads() throws Exception {
        Carga carga = new Carga("Carga", 10.0, 5.0, "Geral", "Santos", "Recife");
        when(cargaService.listar()).thenReturn(List.of(carga));

        mockMvc.perform(get("/cargas")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(token -> token.subject("1").claim("jti", "test-session").claim("role", "ADMIN"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].descricao").value("Carga"));
    }

    @Test
    void getsLoadById() throws Exception {
        Carga carga = new Carga("Carga", 10.0, 5.0, "Geral", "Santos", "Recife");
        when(cargaService.buscarPorId(3L)).thenReturn(carga);

        mockMvc.perform(get("/cargas/3")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(token -> token.subject("1").claim("jti", "test-session").claim("role", "ADMIN"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descricao").value("Carga"));
    }

    @Test
    void updatesLoad() throws Exception {
        Carga carga = new Carga("Carga atualizada", 20.0, 8.0, "Geral", "Santos", "Rio");
        when(cargaService.atualizar(3L, "Carga atualizada", 20.0, 8.0, "Geral", "Santos", "Rio"))
                .thenReturn(carga);

        mockMvc.perform(put("/cargas/3")
                        .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(token -> token.subject("1").claim("jti", "test-session").claim("role", "ADMIN"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .content("""
                                {"descricao":"Carga atualizada","peso":20.0,"volume":8.0,
                                 "tipoCarga":"Geral","origem":"Santos","destino":"Rio"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destino").value("Rio"));
    }

    @Test
    void deletesLoad() throws Exception {
        mockMvc.perform(delete("/cargas/3")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()
                                .jwt(token -> token.subject("1").claim("jti", "test-session").claim("role", "ADMIN"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isNoContent());

        verify(cargaService).excluir(3L);
    }
}

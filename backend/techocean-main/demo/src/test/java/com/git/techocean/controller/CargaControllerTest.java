package com.git.techocean.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.git.techocean.model.Carga;
import com.git.techocean.service.CargaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CargaController.class)
class CargaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CargaService cargaService;

    @Test
    void cadastrarAcceptsJsonRequestBody() throws Exception {
        Carga carga = new Carga("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife");
        when(cargaService.cadastrar("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife"))
                .thenReturn(carga);

        mockMvc.perform(post("/cargas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"descricao":"Bobinas de aço","peso":24.5,"volume":12.8,
                                 "tipoCarga":"Bobinas","origem":"Santos","destino":"Recife"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descricao").value("Bobinas de aço"))
                .andExpect(jsonPath("$.destino").value("Recife"));

        verify(cargaService).cadastrar("Bobinas de aço", 24.5, 12.8, "Bobinas", "Santos", "Recife");
    }
}

package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.git.techocean.model.Solicitacao;
import com.git.techocean.repository.CargaRepository;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.ServicoRepository;
import com.git.techocean.repository.SolicitacaoRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class SolicitacaoServiceTest {

    private final SolicitacaoRepository solicitacaoRepository = mock(SolicitacaoRepository.class);
    private final SolicitacaoService service = new SolicitacaoService(
            solicitacaoRepository,
            mock(ClienteRepository.class),
            mock(CargaRepository.class),
            mock(ServicoRepository.class));
    private final Solicitacao solicitacao = new Solicitacao(null, null, null, "PENDENTE");

    @BeforeEach
    void prepararSolicitacao() {
        when(solicitacaoRepository.findById(1L)).thenReturn(Optional.of(solicitacao));
        when(solicitacaoRepository.save(solicitacao)).thenReturn(solicitacao);
    }

    @Test
    void aceitaPendenteSemDiferenciarMaiusculasEMinusculas() {
        Solicitacao resultado = service.atualizarStatus(1L, "pendente");

        assertEquals("PENDENTE", resultado.getStatus());
        verify(solicitacaoRepository).save(solicitacao);
    }

    @Test
    void aceitaConfirmadoSemDiferenciarMaiusculasEMinusculas() {
        Solicitacao resultado = service.atualizarStatus(1L, "CoNfIrMaDo");

        assertEquals("CONFIRMADO", resultado.getStatus());
        verify(solicitacaoRepository).save(solicitacao);
    }

    @Test
    void rejeitaStatusInvalidoComBadRequest() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.atualizarStatus(1L, "cancelado"));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(solicitacaoRepository, never()).save(solicitacao);
    }
}

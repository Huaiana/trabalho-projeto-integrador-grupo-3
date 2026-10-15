package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Mensagem;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.MensagemRepository;

class MensagemServiceTest {

    private final MensagemRepository mensagemRepository = mock(MensagemRepository.class);
    private final ClienteRepository clienteRepository = mock(ClienteRepository.class);
    private final MensagemService service = new MensagemService(mensagemRepository, clienteRepository);

    @Test
    void deletesExistingCustomerMessage() {
        Mensagem mensagem = new Mensagem();
        when(mensagemRepository.findById(9L)).thenReturn(Optional.of(mensagem));

        service.deletar(9L);

        verify(mensagemRepository).delete(mensagem);
    }

    @Test
    void rejectsDeletingMissingCustomerMessage() {
        when(mensagemRepository.findById(9L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.deletar(9L));

        verify(mensagemRepository, never()).delete(any(Mensagem.class));
    }
}

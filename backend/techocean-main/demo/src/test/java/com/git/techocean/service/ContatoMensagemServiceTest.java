package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.ContatoMensagem;
import com.git.techocean.repository.ContatoMensagemRepository;

class ContatoMensagemServiceTest {

    private final ContatoMensagemRepository repository = mock(ContatoMensagemRepository.class);
    private final ContatoMensagemService service = new ContatoMensagemService(repository);

    @Test
    void createsContactWithoutRequiringCustomerAccount() {
        when(repository.save(any(ContatoMensagem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ContatoMensagem contato = service.criar(" Ana ", " ana@example.com ", " Preciso de ajuda. ");

        assertEquals("Ana", contato.getNome());
        assertEquals("ana@example.com", contato.getEmail());
        assertEquals("Preciso de ajuda.", contato.getConteudo());
        assertEquals("ENVIADO", contato.getStatus());
        verify(repository).save(any(ContatoMensagem.class));
    }

    @Test
    void rejectsInvalidContactEmail() {
        assertThrows(ResponseStatusException.class, () -> service.criar("Ana", "email-invalido", "Ajuda"));
    }

    @Test
    void repliesToContactAndUpdatesStatus() {
        ContatoMensagem contato = new ContatoMensagem("Ana", "ana@example.com", "Preciso de ajuda.");
        when(repository.findById(7L)).thenReturn(Optional.of(contato));
        when(repository.save(contato)).thenReturn(contato);

        ContatoMensagem respondida = service.responder(7L, "Vamos ajudar.");

        assertEquals("Vamos ajudar.", respondida.getResposta());
        assertEquals("RESPONDIDO", respondida.getStatus());
        verify(repository).save(contato);
    }

    @Test
    void deletesExistingContactMessage() {
        ContatoMensagem contato = new ContatoMensagem("Ana", "ana@example.com", "Preciso de ajuda.");
        when(repository.findById(7L)).thenReturn(Optional.of(contato));

        service.deletar(7L);

        verify(repository).delete(contato);
    }

    @Test
    void rejectsDeletingMissingContactMessage() {
        when(repository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> service.deletar(7L));

        verify(repository, never()).delete(any(ContatoMensagem.class));
    }
}

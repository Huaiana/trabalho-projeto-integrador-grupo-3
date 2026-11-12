package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
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

@SuppressWarnings("null")
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
        assertFalse(contato.isLida());
        verify(repository).save(any(ContatoMensagem.class));
    }

    @Test
    void rejectsInvalidContactEmail() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.criar("Ana", "email-invalido", "Ajuda"));
        assertEquals("Informe um e-mail válido.", exception.getReason());
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
    void updatesReadStateWithoutChangingReplyStatus() {
        ContatoMensagem contato = new ContatoMensagem("Ana", "ana@example.com", "Preciso de ajuda.");
        when(repository.findById(7L)).thenReturn(Optional.of(contato));
        when(repository.save(contato)).thenReturn(contato);

        ContatoMensagem lida = service.atualizarLeitura(7L, true);
        assertTrue(lida.isLida());
        assertEquals("ENVIADO", lida.getStatus());

        ContatoMensagem naoLida = service.atualizarLeitura(7L, false);
        assertFalse(naoLida.isLida());
        verify(repository, org.mockito.Mockito.times(2)).save(contato);
    }

    @Test
    void rejectsMissingReadState() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.atualizarLeitura(7L, null));
        assertEquals("Informe se a mensagem foi lida.", exception.getReason());
        verify(repository, never()).save(any(ContatoMensagem.class));
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

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class, () -> service.deletar(7L));

        assertEquals("Mensagem não encontrada.", exception.getReason());
        verify(repository, never()).delete(any(ContatoMensagem.class));
    }
}

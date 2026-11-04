package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Optional;

import com.git.techocean.model.Conteiner;
import com.git.techocean.repository.ConteinerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ConteinerCrudServiceTest {
    private final ConteinerRepository repository = mock(ConteinerRepository.class);
    private final ConteinerService service = new ConteinerService(repository);

    @Test
    void updatesExistingContainer() {
        Conteiner existing = new Conteiner("OLD", "20", "CHEIO");
        when(repository.findById(4L)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Conteiner updated = service.atualizar(4L, "NEW", "40", "VAZIO");

        assertEquals("NEW", updated.getNumeroConteiner());
        assertEquals("40", updated.getTipo());
        assertEquals("VAZIO", updated.getSituacao());
    }

    @Test
    void rejectsMissingContainer() {
        when(repository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> service.excluir(99L));
        verify(repository, never()).delete(any(Conteiner.class));
    }
}

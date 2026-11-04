package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;

import com.git.techocean.model.Cliente;
import com.git.techocean.repository.ClienteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class ClienteServiceTest {

    private final ClienteRepository clienteRepository = mock(ClienteRepository.class);
    private final ClienteService service = new ClienteService(clienteRepository);

    @Test
    void createsClientWithPhoneNumber() {
        when(clienteRepository.existsByEmail("cliente@example.com")).thenReturn(false);
        when(clienteRepository.save(any(Cliente.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Cliente cliente = service.cadastrar(
                "Cliente Teste", "12345678900", "11999990000", "cliente@example.com", "senha123");

        assertEquals("11999990000", cliente.getTelefone());
        verify(clienteRepository).save(any(Cliente.class));
    }

    @Test
    void rejectsClientWithoutPhoneNumber() {
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.cadastrar(
                        "Cliente Teste", "12345678900", " ", "cliente@example.com", "senha123"));

        assertEquals("O campo 'telefone' é obrigatório.", exception.getReason());
    }

    @Test
    void updatesClientFieldsAndHashesANewPassword() {
        Cliente existing = new Cliente("Nome antigo", "11111111111", "11911110000", "old@example.com", "old-hash");
        existing.setId(3L);
        when(clienteRepository.findById(3L)).thenReturn(java.util.Optional.of(existing));
        when(clienteRepository.findByEmail("new@example.com")).thenReturn(null);
        when(clienteRepository.save(existing)).thenReturn(existing);

        Cliente updated = service.atualizar(3L, "Nome novo", "22222222222", "11922220000", "new@example.com", "NovaSenha123");

        assertEquals("Nome novo", updated.getNome());
        assertEquals("22222222222", updated.getCPFCNPJ());
        assertEquals("11922220000", updated.getTelefone());
        assertEquals("new@example.com", updated.getEmail());
        org.junit.jupiter.api.Assertions.assertTrue(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().matches("NovaSenha123", updated.getSenha()));
        verify(clienteRepository).save(existing);
    }

    @Test
    void deletesUnreferencedClient() {
        Cliente existing = new Cliente("Nome", "11111111111", "11911110000", "cliente@example.com", "hash");
        existing.setId(4L);
        when(clienteRepository.findById(4L)).thenReturn(java.util.Optional.of(existing));
        doNothing().when(clienteRepository).delete(existing);

        service.excluir(4L);

        verify(clienteRepository).delete(existing);
        verify(clienteRepository).flush();
    }
}

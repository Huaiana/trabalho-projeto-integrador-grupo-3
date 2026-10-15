package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
}

package com.git.techocean.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.git.techocean.model.Agendamento;
import com.git.techocean.model.Usuario;
import com.git.techocean.repository.AgendamentoRepository;
import com.git.techocean.repository.UsuarioRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AgendamentoServiceTest {

    private final AgendamentoRepository agendamentoRepository = mock(AgendamentoRepository.class);
    private final UsuarioRepository usuarioRepository = mock(UsuarioRepository.class);
    private final AgendamentoService service =
            new AgendamentoService(agendamentoRepository, usuarioRepository);

    @BeforeEach
    void configureRepositories() {
        when(agendamentoRepository.save(any(Agendamento.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioRepository.save(any(Usuario.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void requestsRegistrationBeforeCreatingAppointmentForUnknownEmail() {
        when(usuarioRepository.findByEmailIgnoreCase("novo@example.com")).thenReturn(null);

        AgendamentoException exception = assertThrows(
                AgendamentoException.class,
                () -> service.solicitarVisita(request(null, null, null)));

        assertEquals("CADASTRO_NECESSARIO", exception.getCode());
        verify(agendamentoRepository, never()).save(any(Agendamento.class));
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void createsCustomerAndAppointmentAfterRegistrationDetailsAreProvided() {
        when(usuarioRepository.findByEmailIgnoreCase("novo@example.com")).thenReturn(null);

        Agendamento agendamento = service.solicitarVisita(
                request("12345678900", "senha-segura", null));

        assertEquals("Novo Cliente", agendamento.getUsuario().getNome());
        assertEquals("12345678900", agendamento.getUsuario().getCPF());
        assertEquals("novo@example.com", agendamento.getUsuario().getEmail());
        assertEquals("11999990000", agendamento.getTelefone());
        assertTrue(agendamento.isConfirmado());
        verify(usuarioRepository).save(any(Usuario.class));
        verify(agendamentoRepository).save(any(Agendamento.class));
    }

    @Test
    void createsAppointmentForExistingCustomerWithCorrectPassword() {
        Usuario usuario = new Usuario();
        usuario.setEmail("novo@example.com");
        usuario.setSenha("senha-existente");
        when(usuarioRepository.findByEmailIgnoreCase("novo@example.com")).thenReturn(usuario);

        Agendamento agendamento = service.solicitarVisita(
                request(null, "senha-existente", null));

        assertEquals(usuario, agendamento.getUsuario());
        verify(usuarioRepository).save(any(Usuario.class)); // legacy plaintext is upgraded at successful login
        org.junit.jupiter.api.Assertions.assertNotEquals("senha-existente", usuario.getSenha());
        verify(agendamentoRepository).save(any(Agendamento.class));
    }

    @Test
    void rejectsExistingCustomerWhenPasswordIsIncorrect() {
        Usuario usuario = new Usuario();
        usuario.setEmail("novo@example.com");
        usuario.setSenha("senha-existente");
        when(usuarioRepository.findByEmailIgnoreCase("novo@example.com")).thenReturn(usuario);

        AgendamentoException exception = assertThrows(
                AgendamentoException.class,
                () -> service.solicitarVisita(request(null, "senha-errada", null)));

        assertEquals("SENHA_INVALIDA", exception.getCode());
        verify(agendamentoRepository, never()).save(any(Agendamento.class));
    }

    @Test
    void staffCreatesAppointmentForExistingCustomerWithoutKnowingTheirPassword() {
        Usuario usuario = new Usuario();
        usuario.setId(21L);
        usuario.setNome("Cliente existente");
        usuario.setEmail("cliente@example.com");
        when(usuarioRepository.findById(21L)).thenReturn(java.util.Optional.of(usuario));

        Agendamento agendamento = service.criarPelaEquipe(
                21L, "11999990000", LocalDateTime.now().plusDays(2), false);

        assertEquals(usuario, agendamento.getUsuario());
        assertEquals("11999990000", agendamento.getTelefone());
        assertEquals("Cliente existente", agendamento.getNome());
        assertEquals("cliente@example.com", agendamento.getEmail());
        assertEquals(false, agendamento.isStatus());
        verify(agendamentoRepository).save(agendamento);
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void staffCanUpdateAndDeleteAnAppointment() {
        Usuario usuario = new Usuario();
        usuario.setId(21L);
        usuario.setNome("Cliente existente");
        usuario.setEmail("cliente@example.com");
        Agendamento existing = new Agendamento();
        existing.setId(44L);
        existing.setUsuario(usuario);
        existing.setTelefone("11911112222");
        existing.setDataHora(LocalDateTime.now().plusDays(1));
        existing.setStatus(false);
        when(agendamentoRepository.findById(44L)).thenReturn(java.util.Optional.of(existing));

        Agendamento updated = service.atualizarPelaEquipe(
                44L, null, "11999990000", LocalDateTime.now().plusDays(3), true);
        assertEquals("11999990000", updated.getTelefone());
        assertEquals(true, updated.isStatus());
        verify(agendamentoRepository).save(existing);

        service.excluir(44L);
        verify(agendamentoRepository).delete(existing);
    }

    private Agendamento request(String cpf, String senha, LocalDateTime dataHora) {
        Agendamento agendamento = new Agendamento();
        agendamento.setNome("Novo Cliente");
        agendamento.setTelefone("11999990000");
        agendamento.setEmail("novo@example.com");
        agendamento.setCpf(cpf);
        agendamento.setSenha(senha);
        agendamento.setDataHora(
                dataHora == null ? LocalDateTime.now().plusDays(1) : dataHora);
        agendamento.setConfirmacao(true);
        return agendamento;
    }
}

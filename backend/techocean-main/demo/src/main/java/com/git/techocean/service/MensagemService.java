package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Cliente;
import com.git.techocean.model.Mensagem;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.MensagemRepository;

@Service
public class MensagemService {

    private final MensagemRepository mensagemRepository;
    private final ClienteRepository clienteRepository;

    public MensagemService(MensagemRepository mensagemRepository, ClienteRepository clienteRepository) {
        this.mensagemRepository = mensagemRepository;
        this.clienteRepository = clienteRepository;
    }

    public Mensagem enviarMensagem(Long clienteId, String especialista, String conteudo) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado."));
        
        if (conteudo == null || conteudo.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conteúdo da mensagem é obrigatório.");
        }

        return mensagemRepository.save(new Mensagem(cliente, especialista != null ? especialista : "Suporte", conteudo, "ENVIADO"));
    }

    public List<Mensagem> listarPorCliente(Long clienteId) {
        return mensagemRepository.findByClienteId(clienteId);
    }

    public Mensagem responder(Long id, String resposta) {
        Mensagem mensagem = mensagemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada."));

        if (resposta == null || resposta.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A resposta é obrigatória.");
        }

        mensagem.setResposta(resposta);
        mensagem.setStatus("RESPONDIDO");
        return mensagemRepository.save(mensagem);
    }

    public void deletar(Long id) {
        Mensagem mensagem = mensagemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada."));
        mensagemRepository.delete(mensagem);
    }
}
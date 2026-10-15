package com.git.techocean.service;

import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.ContatoMensagem;
import com.git.techocean.repository.ContatoMensagemRepository;

@Service
public class ContatoMensagemService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final ContatoMensagemRepository repository;

    public ContatoMensagemService(ContatoMensagemRepository repository) {
        this.repository = repository;
    }

    public ContatoMensagem criar(String nome, String email, String conteudo) {
        String nomeValidado = validarTexto(nome, "Nome", 120);
        String emailValidado = validarTexto(email, "E-mail", 254);
        String conteudoValidado = validarTexto(conteudo, "Mensagem", 1000);

        if (!EMAIL_PATTERN.matcher(emailValidado).matches()) {
            throw erro("Informe um e-mail válido.");
        }

        return repository.save(new ContatoMensagem(nomeValidado, emailValidado, conteudoValidado));
    }

    public List<ContatoMensagem> listar() {
        return repository.findAllByOrderByCriadoEmDesc();
    }

    public ContatoMensagem responder(Long id, String resposta) {
        ContatoMensagem contato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada."));
        contato.setResposta(validarTexto(resposta, "Resposta", 1000));
        contato.setStatus("RESPONDIDO");
        return repository.save(contato);
    }

    public void deletar(Long id) {
        ContatoMensagem contato = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mensagem não encontrada."));
        repository.delete(contato);
    }

    private String validarTexto(String valor, String campo, int limite) {
        if (valor == null || valor.trim().isEmpty()) {
            throw erro("O campo '" + campo + "' é obrigatório.");
        }
        String texto = valor.trim();
        if (texto.length() > limite) {
            throw erro("O campo '" + campo + "' deve ter no máximo " + limite + " caracteres.");
        }
        return texto;
    }

    private ResponseStatusException erro(String mensagem) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, mensagem);
    }
}

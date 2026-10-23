package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Conteiner;
import com.git.techocean.repository.ConteinerRepository;

@Service
public class ConteinerService {

    private final ConteinerRepository conteinerRepository;

    public ConteinerService(ConteinerRepository conteinerRepository) {
        this.conteinerRepository = conteinerRepository;
    }

    public Conteiner cadastrar(String numeroConteiner, String tipo, String situacao) {
        validarObrigatorios(numeroConteiner, tipo, situacao);
        return conteinerRepository.save(new Conteiner(numeroConteiner, tipo, situacao));
    }

    public List<Conteiner> listar() {
        return conteinerRepository.findAll();
    }

    public Conteiner buscarPorId(Long id) {
        validarId(id);
        return conteinerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contêiner não encontrado."));
    }

    public Conteiner atualizar(Long id, String numeroConteiner, String tipo, String situacao) {
        validarObrigatorios(numeroConteiner, tipo, situacao);
        Conteiner conteiner = buscarPorId(id);
        conteiner.setNumeroConteiner(numeroConteiner.trim());
        conteiner.setTipo(tipo.trim());
        conteiner.setSituacao(situacao.trim());
        return conteinerRepository.save(conteiner);
    }

    public void excluir(Long id) {
        conteinerRepository.delete(buscarPorId(id));
    }

    private void validarObrigatorios(String numeroConteiner, String tipo, String situacao) {
        if (numeroConteiner == null || numeroConteiner.trim().isEmpty() || tipo == null || tipo.trim().isEmpty()
                || situacao == null || situacao.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número, tipo e situação são obrigatórios.");
        }
    }

    private void validarId(Long id) {
        if (id == null || id <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID inválido.");
    }
}

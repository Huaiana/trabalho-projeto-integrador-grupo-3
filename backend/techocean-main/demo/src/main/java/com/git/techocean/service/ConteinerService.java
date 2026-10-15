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
        if (numeroConteiner == null || numeroConteiner.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Número do contêiner é obrigatório.");
        }
        return conteinerRepository.save(new Conteiner(numeroConteiner, tipo, situacao));
    }

    public List<Conteiner> listar() {
        return conteinerRepository.findAll();
    }

    public Conteiner buscarPorId(Long id) {
        return conteinerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contêiner não encontrado."));
    }
}
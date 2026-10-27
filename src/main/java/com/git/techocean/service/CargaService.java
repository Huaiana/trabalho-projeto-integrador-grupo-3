package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Carga;
import com.git.techocean.repository.CargaRepository;

@Service
public class CargaService {

    private final CargaRepository cargaRepository;

    public CargaService(CargaRepository cargaRepository) {
        this.cargaRepository = cargaRepository;
    }

    public Carga cadastrar(String descricao, Double peso, Double volume, String tipoCarga, String origem, String destino) {
        if (descricao == null || descricao.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Descrição da carga é obrigatória.");
        }
        if (peso == null || peso <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Peso inválido.");
        }
        if (volume == null || volume <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume inválido.");
        }

        return cargaRepository.save(new Carga(descricao, peso, volume, tipoCarga, origem, destino));
    }

    public List<Carga> listar() {
        return cargaRepository.findAll();
    }

    public Carga buscarPorId(Long id) {
        return cargaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carga não encontrada."));
    }
}
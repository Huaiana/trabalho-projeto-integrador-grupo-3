package com.git.techocean.service;

import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
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
        validarDados(descricao, peso, volume, tipoCarga, origem, destino);
        return cargaRepository.save(new Carga(descricao, peso, volume, tipoCarga, origem, destino));
    }

    public List<Carga> listar() {
        return cargaRepository.findAll();
    }

    public @NonNull Carga buscarPorId(@NonNull Long id) {
        return Objects.requireNonNull(cargaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Carga não encontrada.")));
    }

    public Carga atualizar(@NonNull Long id, String descricao, Double peso, Double volume, String tipoCarga,
            String origem, String destino) {
        validarDados(descricao, peso, volume, tipoCarga, origem, destino);
        Carga carga = buscarPorId(id);
        carga.setDescricao(descricao.trim());
        carga.setPeso(peso);
        carga.setVolume(volume);
        carga.setTipoCarga(tipoCarga.trim());
        carga.setOrigem(origem.trim());
        carga.setDestino(destino.trim());
        return cargaRepository.save(carga);
    }

    public void excluir(@NonNull Long id) {
        cargaRepository.delete(buscarPorId(id));
    }

    private void validarDados(String descricao, Double peso, Double volume, String tipoCarga, String origem,
            String destino) {
        if (descricao == null || descricao.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Descrição da carga é obrigatória.");
        }
        if (peso == null || peso <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Peso inválido.");
        }
        if (volume == null || volume <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Volume inválido.");
        }
        if (tipoCarga == null || tipoCarga.trim().isEmpty() || origem == null || origem.trim().isEmpty()
                || destino == null || destino.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Tipo de carga, origem e destino são obrigatórios.");
        }
    }
}
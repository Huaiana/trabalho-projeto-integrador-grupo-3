package com.git.techocean.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.git.techocean.model.Servico;
import com.git.techocean.repository.ServicoRepository;

@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;

    public ServicoService(ServicoRepository servicoRepository) {
        this.servicoRepository = servicoRepository;
    }

    public Servico cadastrar(String nome, String descricao, String categoria, Boolean disponivel) {
        if (nome == null || nome.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do serviço é obrigatório.");
        }
        return servicoRepository.save(new Servico(nome, descricao, categoria, disponivel != null ? disponivel : true));
    }

    public List<Servico> listarDisponiveis() {
        return servicoRepository.findByDisponivelTrue();
    }

    public Servico buscarPorId(Long id) {
        validarId(id);
        return servicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado."));
    }

    public List<Servico> listarTodos() { return servicoRepository.findAll(); }

    public Servico atualizar(Long id, String nome, String descricao, String categoria, Boolean disponivel) {
        validar(nome, descricao, categoria);
        Servico servico = buscarPorId(id);
        servico.setNome(nome.trim()); servico.setDescricao(descricao.trim()); servico.setCategoria(categoria.trim());
        if (disponivel != null) servico.setDisponivel(disponivel);
        return servicoRepository.save(servico);
    }

    public void excluir(Long id) { servicoRepository.delete(buscarPorId(id)); }

    private void validar(String nome, String descricao, String categoria) {
        if (nome == null || nome.trim().isEmpty() || descricao == null || descricao.trim().isEmpty()
                || categoria == null || categoria.trim().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome, descrição e categoria são obrigatórios.");
    }
    private void validarId(Long id) {
        if (id == null || id <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID inválido.");
    }
}

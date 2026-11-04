package com.git.techocean.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.git.techocean.model.Mensagem;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    // Retorna o histórico de atendimento do cliente (RF08)
    List<Mensagem> findByClienteId(Long clienteId);

    // Lista mensagens por status de atendimento (ex: ENVIADO, EM_ATENDIMENTO)
    List<Mensagem> findByStatus(String status);
}
package com.git.techocean.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.git.techocean.model.Agendamento;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    // Lista agendamentos vinculados a um determinado cliente
    List<Agendamento> findByUsuarioId(Long usuarioId);

    // Lista agendamentos filtrados por status (ex: AGENDADO, REALIZADO, CANCELADO)
    List<Agendamento> findByStatus(boolean status);

    // Consulta agendamentos em um intervalo de datas
    List<Agendamento> findByDataHoraBetween(LocalDateTime inicio, LocalDateTime fim);
}
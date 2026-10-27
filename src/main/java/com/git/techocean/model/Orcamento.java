package com.git.techocean.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "carga_id", nullable = false)
    private Carga carga;

    @ManyToOne
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @Column(nullable = false)
    private String status; // Ex: PENDENTE, EM_ANALISE, APROVADO, RECUSADO

    @Column(nullable = true)
    private Double valorEstimado;

    @Column(nullable = true, length = 500)
    private String observacoes;

    public Orcamento(Cliente cliente, Carga carga, Servico servico, String status) {
        this.cliente = cliente;
        this.carga = carga;
        this.servico = servico;
        this.status = status;
    }

    public Orcamento(Cliente cliente, Carga carga, Servico servico, String status, Double valorEstimado, String observacoes) {
        this.cliente = cliente;
        this.carga = carga;
        this.servico = servico;
        this.status = status;
        this.valorEstimado = valorEstimado;
        this.observacoes = observacoes;
    }
}
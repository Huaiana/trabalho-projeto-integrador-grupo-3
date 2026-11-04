package com.git.techocean.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Operacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "solicitacao_id", nullable = false)
    private Solicitacao solicitacao;

    @ManyToOne
    @JoinColumn(name = "conteiner_id")
    private Conteiner conteiner;

    @Column(nullable = false)
    private String responsavel;

    @Column(nullable = false)
    private String andamento;

    @Column(nullable = false)
    private String observacoes;

    public Operacao(Solicitacao solicitacao, Conteiner conteiner, String responsavel, String andamento, String observacoes) {
        this.solicitacao = solicitacao;
        this.conteiner = conteiner;
        this.responsavel = responsavel;
        this.andamento = andamento;
        this.observacoes = observacoes;
    }
}
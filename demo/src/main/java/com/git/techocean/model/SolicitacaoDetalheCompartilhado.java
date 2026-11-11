package com.git.techocean.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class SolicitacaoDetalheCompartilhado {
    @Id
    private Long id;

    @Version
    private Long versao;

    @OneToOne(optional = false)
    @MapsId
    @JoinColumn(name = "id")
    private Solicitacao solicitacao;

    @Column(nullable = false)
    private String nomeServico;

    @Column(nullable = false)
    private String categoria;

    @Column(nullable = false, length = 2000)
    private String descricao;

    @ManyToOne
    private ReferenciaCompartilhada servicoReferencia;

    @ManyToOne
    private ReferenciaCompartilhada cargaReferencia;

    @ManyToOne
    private ReferenciaCompartilhada conteinerReferencia;

    @ManyToOne
    private ReferenciaCompartilhada operacaoReferencia;

    @ManyToOne
    private ReferenciaCompartilhada orcamentoReferencia;

    @Column(precision = 15, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private Long prestadorId;

    @Column(nullable = false)
    private String prestadorNome;

    @Column(nullable = false)
    private String prestadorCargo;

    @Column(nullable = false, length = 20)
    private String statusSolicitacao;

    @Column(nullable = false, updatable = false)
    private Instant criadoEm;

    @Column(nullable = false)
    private Instant atualizadoEm;
}

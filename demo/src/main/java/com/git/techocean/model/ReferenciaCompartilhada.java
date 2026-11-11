package com.git.techocean.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ReferenciaCompartilhada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    private Long versao;

    @Column(nullable = false, length = 20)
    private String tipo;

    @Column(nullable = false)
    private String nome;

    @Column(length = 255)
    private String categoria;

    @Column(length = 2000)
    private String descricao;

    @Column(precision = 15, scale = 2)
    private BigDecimal valor;

    public String getCodigo() {
        return id == null ? null : tipo + "-" + String.format("%06d", id);
    }
}

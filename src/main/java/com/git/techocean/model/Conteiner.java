package com.git.techocean.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Conteiner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String numeroConteiner;

    @Column(nullable = false)
    private String tipo;

    @Column(nullable = false)
    private String situacao;

    public Conteiner(String numeroConteiner, String tipo, String situacao) {
        this.numeroConteiner = numeroConteiner;
        this.tipo = tipo;
        this.situacao = situacao;
    }
}
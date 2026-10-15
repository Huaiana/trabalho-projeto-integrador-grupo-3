package com.git.techocean.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Carga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false)
    private Double peso;

    @Column(nullable = false)
    private Double volume;

    @Column(nullable = false)
    private String tipoCarga;

    @Column(nullable = false)
    private String origem;

    @Column(nullable = false)
    private String destino;

    public Carga(String descricao, Double peso, Double volume, String tipoCarga, String origem, String destino) {
        this.descricao = descricao;
        this.peso = peso;
        this.volume = volume;
        this.tipoCarga = tipoCarga;
        this.origem = origem;
        this.destino = destino;
    }
}
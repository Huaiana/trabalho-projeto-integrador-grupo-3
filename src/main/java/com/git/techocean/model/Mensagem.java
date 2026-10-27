package com.git.techocean.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Mensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(nullable = false)
    private String especialista;

    @Column(nullable = false, length = 1000)
    private String conteudo;

    @Column(length = 1000)
    private String resposta;

    @Column(nullable = false)
    private String status;

    public Mensagem(Cliente cliente, String especialista, String conteudo, String status) {
        this.cliente = cliente;
        this.especialista = especialista;
        this.conteudo = conteudo;
        this.status = status;
    }
}
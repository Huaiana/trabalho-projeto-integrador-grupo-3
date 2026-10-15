package com.git.techocean.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mensagem_contato")
@Getter
@Setter
@NoArgsConstructor
public class ContatoMensagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(nullable = false, length = 1000)
    private String conteudo;

    @Column(length = 1000)
    private String resposta;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(nullable = false)
    private LocalDateTime criadoEm;

    public ContatoMensagem(String nome, String email, String conteudo) {
        this.nome = nome;
        this.email = email;
        this.conteudo = conteudo;
        this.status = "ENVIADO";
    }

    @PrePersist
    void definirDataCriacao() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}

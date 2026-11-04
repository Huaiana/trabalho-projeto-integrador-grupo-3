package com.git.techocean.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String CPFCNPJ; // cpf xxx.xxx.xxx-xx, cnpj xx.xxx.xxx/xxxx-xx 

    @Column(nullable = false)
    private String telefone; //( ) x xxxx-xxxx

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String senha; // 8 ou + caracteres com numeros e letras 

    public Cliente(String nome, String CPFCNPJ, String telefone, String email, String senha) {
        this.nome = nome;
        this.CPFCNPJ = CPFCNPJ;
        this.telefone = telefone;
        this.email = email;
        this.senha = senha;
    }
}

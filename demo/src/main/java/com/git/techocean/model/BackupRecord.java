package com.git.techocean.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class BackupRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String backupCode;
    private String type;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private Instant createdAt;
    private int clientes;
    private int orcamentos;
    private int solicitacoes;
    private int operacoes;
    private int mensagens;
    private int administradores;
    private int totalRegistros;
}

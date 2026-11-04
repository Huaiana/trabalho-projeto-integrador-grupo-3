package com.git.techocean.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.git.techocean.model.BackupRecord;
import com.git.techocean.service.BackupService;

@RestController
@RequestMapping("/api/backup")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    // Acesso exclusivo do Administrador: Backup Global de todo o sistema
    @PostMapping("/admin/completo")
    public ResponseEntity<BackupRecord> dispararBackupAdministrativo(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt actor) {
        return new ResponseEntity<>(backupService.gerarBackupAdministrativo(Long.valueOf(actor.getSubject())), HttpStatus.OK);
    }

    // Acesso do Funcionário (e também liberado para o Administrador): Backup de atendimento e operações
    @PostMapping("/operacional")
    public ResponseEntity<BackupRecord> dispararBackupOperacional(
            @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt actor) {
        return new ResponseEntity<>(backupService.gerarBackupOperacional(Long.valueOf(actor.getSubject())), HttpStatus.OK);
    }

    @org.springframework.web.bind.annotation.GetMapping("/historico")
    public List<BackupRecord> historico() {
        return backupService.historico();
    }
}
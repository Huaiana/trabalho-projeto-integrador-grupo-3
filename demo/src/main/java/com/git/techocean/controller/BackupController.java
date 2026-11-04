package com.git.techocean.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<String> dispararBackupAdministrativo() {
        String resultado = backupService.gerarBackupAdministrativo();
        return new ResponseEntity<>(resultado, HttpStatus.OK);
    }

    // Acesso do Funcionário (e também liberado para o Administrador): Backup de atendimento e operações
    @PostMapping("/operacional")
    public ResponseEntity<String> dispararBackupOperacional() {
        String resultado = backupService.gerarBackupOperacional();
        return new ResponseEntity<>(resultado, HttpStatus.OK);
    }
}
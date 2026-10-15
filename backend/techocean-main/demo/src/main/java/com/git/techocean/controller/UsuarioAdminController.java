package com.git.techocean.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.service.UsuarioAdminService;

@RestController
@RequestMapping("/admin")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    public UsuarioAdminController(UsuarioAdminService usuarioAdminService) {
        this.usuarioAdminService = usuarioAdminService;
    }

    // RF10 - Gestão de acessos administrativos
    @PostMapping("/cadastrar")
    public ResponseEntity<UsuarioAdmin> cadastrar(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam String cargo) {
        UsuarioAdmin admin = usuarioAdminService.cadastrar(nome, email, senha, cargo);
        return new ResponseEntity<>(admin, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioAdmin> login(@RequestBody UsuarioAdmin admin) {
        UsuarioAdmin adminAutenticado = usuarioAdminService.login(admin.getEmail(), admin.getSenha());
        return new ResponseEntity<>(adminAutenticado, HttpStatus.OK);
    }
}
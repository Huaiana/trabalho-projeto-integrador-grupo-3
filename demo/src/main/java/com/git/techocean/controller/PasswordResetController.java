package com.git.techocean.controller;

import com.git.techocean.service.PasswordResetService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/password-reset")
public class PasswordResetController {

    private final PasswordResetService service;

    public PasswordResetController(PasswordResetService service) {
        this.service = service;
    }

    @PostMapping("/request")
    public ResponseEntity<Void> request(@Valid @RequestBody ResetRequest request) {
        service.requestReset(request.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/confirm")
    public ResponseEntity<Void> confirm(@Valid @RequestBody ConfirmRequest request) {
        service.confirmReset(request.token(), request.senha());
        return ResponseEntity.noContent().build();
    }

    public record ResetRequest(@NotBlank @Email String email) {}
    public record ConfirmRequest(@NotBlank String token, @NotBlank @Size(min = 8) String senha) {}
}

package com.git.techocean.service;

import com.git.techocean.model.Cliente;
import com.git.techocean.model.PasswordResetToken;
import com.git.techocean.model.UsuarioAdmin;
import com.git.techocean.repository.ClienteRepository;
import com.git.techocean.repository.PasswordResetTokenRepository;
import com.git.techocean.repository.UsuarioAdminRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PasswordResetService {

    private static final Duration TOKEN_LIFETIME = Duration.ofMinutes(30);
    private final PasswordResetTokenRepository tokenRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioAdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final Optional<JavaMailSender> mailSender;
    private final String publicUrl;
    private final String mailFrom;
    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(PasswordResetTokenRepository tokenRepository, ClienteRepository clienteRepository,
            UsuarioAdminRepository adminRepository, PasswordEncoder passwordEncoder, Optional<JavaMailSender> mailSender,
            @Value("${APP_PUBLIC_URL:http://localhost:5173}") String publicUrl,
            @Value("${MAIL_FROM:}") String mailFrom) {
        this.tokenRepository = tokenRepository;
        this.clienteRepository = clienteRepository;
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
        this.mailFrom = mailFrom;
    }

    @Transactional
    public void requestReset(String email) {
        String normalized = normalizeEmail(email);
        UsuarioAdmin admin = adminRepository.findByEmailIgnoreCase(normalized);
        String accountType = "ADMIN";
        Long accountId = admin == null ? null : admin.getId();
        if (admin == null) {
            Cliente cliente = clienteRepository.findByEmail(normalized);
            accountType = "CLIENTE";
            accountId = cliente == null ? null : cliente.getId();
        }
        if (accountId == null) return;
        if (mailFrom.isBlank() || mailSender.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Recuperação de senha indisponível: o envio de e-mail não está configurado.");
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        PasswordResetToken token = new PasswordResetToken(java.util.UUID.randomUUID().toString(),
                hash(rawToken), accountType, accountId, Instant.now().plus(TOKEN_LIFETIME));
        tokenRepository.save(token);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(normalized);
        message.setSubject("Redefinição de senha Techocean");
        message.setText("Acesse este link para criar uma nova senha (válido por 30 minutos):\n\n"
                + publicUrl + "/redefinir-senha?token=" + rawToken);
        mailSender.orElseThrow(() -> new IllegalStateException("JavaMailSender não configurado.")).send(message);
    }

    @Transactional
    public void confirmReset(String rawToken, String newPassword) {
        if (rawToken == null || rawToken.isBlank()) {
            throw invalidToken();
        }
        validatePassword(newPassword);
        PasswordResetToken token = tokenRepository.findByTokenHashAndUsedAtIsNull(hash(rawToken))
                .filter(item -> item.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(this::invalidToken);
        Long accountId = Objects.requireNonNull(token.getAccountId());
        if ("ADMIN".equals(token.getAccountType())) {
            UsuarioAdmin user = adminRepository.findById(accountId).orElseThrow(this::invalidToken);
            user.setSenha(passwordEncoder.encode(newPassword));
            adminRepository.save(user);
        } else {
            Cliente user = clienteRepository.findById(accountId).orElseThrow(this::invalidToken);
            user.setSenha(passwordEncoder.encode(newPassword));
            clienteRepository.save(user);
        }
        token.setUsedAt(Instant.now());
        tokenRepository.save(token);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8 || !password.matches(".*[A-Za-z].*")
                || !password.matches(".*\\d.*")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "A senha precisa ter pelo menos 8 caracteres, com letras e números.");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "E-mail é obrigatório.");
        }
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }

    private ResponseStatusException invalidToken() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido ou expirado.");
    }

    private String hash(String value) {
        try {
            return Base64.getEncoder().encodeToString(
                    MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 não disponível.", ex);
        }
    }
}

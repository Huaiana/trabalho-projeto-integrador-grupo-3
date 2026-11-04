package com.git.techocean.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @Column(nullable = false)
    private String accountType;

    @Column(nullable = false)
    private Long accountId;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant usedAt;

    public PasswordResetToken(String id, String tokenHash, String accountType, Long accountId, Instant expiresAt) {
        this.id = id;
        this.tokenHash = tokenHash;
        this.accountType = accountType;
        this.accountId = accountId;
        this.expiresAt = expiresAt;
    }
}

package com.git.techocean.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor
public class AuthSession {
    @Id
    private String id;
    @Column(nullable = false) private Long actorId;
    @Column(nullable = false) private String actorName;
    @Column(nullable = false) private String role;
    @Column(nullable = false) private Instant startedAt;
    @Column(nullable = false) private Instant lastActivityAt;
    private Instant loggedOutAt;
}

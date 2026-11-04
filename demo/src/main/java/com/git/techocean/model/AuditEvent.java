package com.git.techocean.model;

import jakarta.persistence.Column;
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
public class AuditEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long actorId;
    private String actorName;
    private String actorRole;
    @Column(nullable = false) private String action;
    @Column(nullable = false) private String method;
    @Column(nullable = false) private String resource;
    private String resourceId;
    @Column(nullable = false) private Instant occurredAt;
    private int responseStatus;
    private String ipAddress;
}

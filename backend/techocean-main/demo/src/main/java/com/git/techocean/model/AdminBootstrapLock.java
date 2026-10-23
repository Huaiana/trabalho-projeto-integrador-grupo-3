package com.git.techocean.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
public class AdminBootstrapLock {
    @Id
    private String id;

    public AdminBootstrapLock(String id) { this.id = id; }
}

package com.git.techocean.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class AdminSetupConfig {

    @Id
    private Long id = 1L;

    private boolean enabled;
}

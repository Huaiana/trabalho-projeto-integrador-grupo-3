package com.git.techocean.repository;

import com.git.techocean.model.PasswordResetToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, String> {
    Optional<PasswordResetToken> findByTokenHashAndUsedAtIsNull(String tokenHash);
}

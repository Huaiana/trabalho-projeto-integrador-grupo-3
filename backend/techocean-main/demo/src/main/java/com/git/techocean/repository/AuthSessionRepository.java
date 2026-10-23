package com.git.techocean.repository;

import com.git.techocean.model.AuthSession;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    List<AuthSession> findAllByLoggedOutAtIsNull();
}

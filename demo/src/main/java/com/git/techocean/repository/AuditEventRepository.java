package com.git.techocean.repository;

import com.git.techocean.model.AuditEvent;
import java.util.List;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {
    List<AuditEvent> findBySessionIdOrderByOccurredAtAsc(String sessionId);
    List<AuditEvent> findByActorIdAndOccurredAtBetweenOrderByOccurredAtAsc(Long actorId, Instant start, Instant end);
}

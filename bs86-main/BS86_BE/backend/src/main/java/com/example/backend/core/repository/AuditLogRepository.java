package com.example.backend.core.repository;

import com.example.backend.core.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AuditLogRepository {
    AuditLog save(AuditLog log);

    Page<AuditLog> findByEntityNameAndEntityId(String entityName, Long entityId, Pageable pageable);

    Page<AuditLog> findByChangedBy(Long userId, Pageable pageable);

    Page<AuditLog> findByChangedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    Page<AuditLog> findByEntityNameAndChangedAtBetween(String entityName, LocalDateTime startDate,
            LocalDateTime endDate, Pageable pageable);
}

package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.AuditLog;
import com.example.backend.core.repository.AuditLogRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.AuditLogJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.AuditLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditLogRepositoryAdapter implements AuditLogRepository {
    private final AuditLogJpaRepository repo;
    private final AuditLogMapper mapper;

    @Override
    public AuditLog save(AuditLog log) {
        return mapper.toDomain(repo.save(mapper.toEntity(log)));
    }

    @Override
    public Page<AuditLog> findByEntityNameAndEntityId(String entityName, Long entityId, Pageable pageable) {
        return repo.findByEntityNameAndEntityId(entityName, entityId, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<AuditLog> findByChangedBy(Long userId, Pageable pageable) {
        return repo.findByChangedBy(userId, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<AuditLog> findByChangedAtBetween(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        return repo.findByChangedAtBetween(startDate, endDate, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<AuditLog> findByEntityNameAndChangedAtBetween(String entityName, LocalDateTime startDate,
            LocalDateTime endDate, Pageable pageable) {
        return repo.findByEntityNameAndChangedAtBetween(entityName, startDate, endDate, pageable).map(mapper::toDomain);
    }
}

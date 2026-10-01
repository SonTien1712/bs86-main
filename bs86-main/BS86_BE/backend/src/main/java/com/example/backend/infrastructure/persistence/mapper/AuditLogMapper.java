package com.example.backend.infrastructure.persistence.mapper;

import com.example.backend.core.entity.AuditLog;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {
    AuditLog toDomain(AuditLogEntity entity);

    AuditLogEntity toEntity(AuditLog domain);
}

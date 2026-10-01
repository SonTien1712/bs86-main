package com.example.backend.core.entity;

import com.example.backend.core.enums.AuditAction;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLog {
    private Long id;
    private String entityName;
    private Long entityId;
    private AuditAction action;
    private String oldValue;
    private String newValue;
    private Long changedBy;
    private LocalDateTime changedAt;
    private String ipAddress;
    private String userAgent;
    private String reason;
}

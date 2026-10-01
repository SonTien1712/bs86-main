package com.example.backend.core.service;

import com.example.backend.core.enums.AuditAction;
import com.example.backend.core.enums.EntityType;
import com.example.backend.core.entity.AuditLog;
import com.example.backend.core.repository.AuditLogRepository;
import com.example.backend.core.repository.UserRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.AuditLogJpaRepository;
import com.example.backend.presentation.dto.response.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;      // DOMAIN WRITE
    private final AuditLogJpaRepository auditLogJpaRepository; // JPA READ
    private final ObjectMapper objectMapper;

    // 👉 thêm để lấy user info
    private final UserRepository userRepository;

    // =====================================================
    // WRITE LOG
    // =====================================================

    public void logChange(EntityType entityType,
                          Long entityId,
                          AuditAction action,
                          Object oldValue,
                          Object newValue,
                          String reason) {
        Long userId = getCurrentUserIdSafe();
        try {

            AuditLog log = new AuditLog();

            log.setEntityName(entityType.name());
            log.setEntityId(entityId);
            log.setAction(action);

            log.setOldValue(oldValue != null
                    ? objectMapper.writeValueAsString(oldValue)
                    : null);

            log.setNewValue(newValue != null
                    ? objectMapper.writeValueAsString(newValue)
                    : null);

            log.setChangedBy(userId);
            log.setChangedAt(LocalDateTime.now());
            log.setReason(reason);

            auditLogRepository.save(log);

        } catch (Exception e) {
            System.err.println("Lỗi ghi audit log: " + e.getMessage());
        }
    }

    // =====================================================
    // MAP ENTITY -> RESPONSE
    // =====================================================
    private AuditLogResponse mapToResponse(AuditLogEntity log) {

        Instant time = log.getChangedAt() != null
                ? log.getChangedAt().atZone(ZoneId.systemDefault()).toInstant()
                : null;

        // ===== USER DISPLAY FIX =====
        String userDisplay = "-";

        if (log.getChangedBy() != null) {
            userDisplay = userRepository.findById(log.getChangedBy())
                    .map(u -> {
                        String contact = (u.getPhoneNumber() != null && !u.getPhoneNumber().isBlank())
                                ? u.getPhoneNumber()
                                : u.getEmail();

                        return u.getFullName() + " - " + contact;
                    })
                    .orElse("User #" + log.getChangedBy());
        }

        return AuditLogResponse.builder()
                .time(time)
                .type(log.getEntityName() != null ? log.getEntityName() : "-")
                .user(userDisplay)
                .event(log.getAction() != null ? log.getAction().name() : "-")
                .field(log.getEntityId() != null ? String.valueOf(log.getEntityId()) : "-")
                .result(parseResultSafe(log.getNewValue()))
                .build();
    }

    // =====================================================
    // SEARCH LOG
    // =====================================================
    public Page<AuditLogResponse> searchLogs(String keyword,
                                             String type,
                                             LocalDateTime start,
                                             LocalDateTime end,
                                             Pageable pageable) {

        return auditLogJpaRepository
                .searchLogs(keyword, type, start, end, pageable)
                .map(this::mapToResponse);
    }

    // =====================================================
    // USER LOGS
    // =====================================================
    public Page<AuditLogResponse> getUserActions(Long userId, Pageable pageable) {

        if (userId == null) return Page.empty();

        return auditLogJpaRepository
                .findByChangedBy(userId, pageable)
                .map(this::mapToResponse);
    }

    public Page<AuditLogResponse> getUserActionsBetween(Long userId,
                                                        LocalDateTime start,
                                                        LocalDateTime end,
                                                        Pageable pageable) {

        return auditLogJpaRepository
                .findByChangedByAndChangedAtBetween(userId, start, end, pageable)
                .map(this::mapToResponse);
    }

    // =====================================================
    // ENTITY HISTORY
    // =====================================================
    public Page<AuditLogResponse> getEntityHistory(EntityType entityType,
                                                   Long entityId,
                                                   Pageable pageable) {

        return auditLogJpaRepository
                .findByEntityNameAndEntityId(entityType.name(), entityId, pageable)
                .map(this::mapToResponse);
    }

    // =====================================================
    // FILTER BY DATE + TYPE
    // =====================================================
    public Page<AuditLogResponse> getChangesBetween(LocalDateTime startDate,
                                                    LocalDateTime endDate,
                                                    EntityType entityType,
                                                    Pageable pageable) {

        if (startDate == null) startDate = LocalDateTime.now().minusDays(30);
        if (endDate == null) endDate = LocalDateTime.now();

        Page<AuditLogEntity> result;

        if (entityType != null) {
            result = auditLogJpaRepository.findByEntityNameAndChangedAtBetween(
                    entityType.name(),
                    startDate,
                    endDate,
                    pageable
            );
        } else {
            result = auditLogJpaRepository.findByChangedAtBetween(
                    startDate,
                    endDate,
                    pageable
            );
        }

        return result.map(this::mapToResponse);
    }

    // =====================================================
    // STATS
    // =====================================================
    public Map<String, Object> getLogStats() {

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        List<AuditLogEntity> logs =
                auditLogJpaRepository.findByChangedAtBetween(startOfDay, now);

        long totalToday = logs.size();

        long systemErrors = logs.stream()
                .filter(l -> l.getNewValue() != null && l.getNewValue().contains("FAILED"))
                .count();

        long successBookings = logs.stream()
                .filter(l -> l.getNewValue() != null && l.getNewValue().contains("CREATE_BOOKING"))
                .count();

        long cancelBookings = logs.stream()
                .filter(l -> l.getNewValue() != null && l.getNewValue().contains("CANCEL_BOOKING"))
                .count();

        return Map.of(
                "totalToday", totalToday,
                "systemErrors", systemErrors,
                "successBookings", successBookings,
                "cancelBookings", cancelBookings
        );
    }

    // =====================================================
    // RESULT PARSER
    // =====================================================
    private String parseResultSafe(String newValue) {
        if (newValue == null) return "SUCCESS";

        if (newValue.contains("FAILED")) return "FAILED";
        return "SUCCESS";
    }
    private Long getCurrentUserIdSafe() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return null;
        }
    }
}
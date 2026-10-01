package com.example.backend.presentation.controller;

import com.example.backend.core.enums.EntityType;
import com.example.backend.core.entity.AuditLog;
import com.example.backend.core.service.AuditService;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import com.example.backend.infrastructure.security.SecurityUtils;
import com.example.backend.presentation.dto.response.AuditLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    // Helper tạo Pageable chuẩn
    private Pageable createPageRequest(int page, int size) {
        return PageRequest.of(page, size, Sort.by("changedAt").descending());
    }

    // =====================================================
    // 1. XEM LỊCH SỬ BOOKING
    // =====================================================

    @GetMapping("/bookings/{id}/history")
    public ResponseEntity<Page<AuditLogResponse>> getBookingHistory(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        return ResponseEntity.ok(
                auditService.getEntityHistory(
                        EntityType.BOOKING,
                        id,
                        createPageRequest(page, size)
                )
        );
    }

    // =====================================================
    // 2. USER ACTIONS
    // =====================================================

    @GetMapping("/users/{userId}/actions")
    public ResponseEntity<Page<AuditLogResponse>> getUserActions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        return ResponseEntity.ok(
                auditService.getUserActions(
                        userId,
                        createPageRequest(page, size)
                )
        );
    }

    // =====================================================
    // 3. SEARCH / FILTER CHANGES
    // =====================================================

    @GetMapping("/changes")
    public ResponseEntity<Page<AuditLogResponse>> getChanges(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate,

            @RequestParam(required = false)
            EntityType type,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {

        return ResponseEntity.ok(
                auditService.getChangesBetween(
                        startDate,
                        endDate,
                        type,
                        createPageRequest(page, size)
                )
        );
    }
}
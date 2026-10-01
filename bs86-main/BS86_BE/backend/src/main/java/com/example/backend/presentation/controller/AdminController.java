package com.example.backend.presentation.controller;

import com.example.backend.core.enums.ReportStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import com.example.backend.presentation.dto.response.*;
import com.example.backend.core.service.AdminService;
import com.example.backend.core.service.FinanceManagementService;
import com.example.backend.presentation.dto.request.OwnerPayoutRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ========== owner ==========

    @PostMapping("/owners/verifications/{verificationId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveOwner(@PathVariable Long verificationId) {
        adminService.approveOwnerByVerificationId(verificationId);
        return ResponseEntity.ok(new ApiResponse<>("Owner approved", null));
    }

    @PostMapping("/owners/verifications/{verificationId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectOwnerByVerificationId(
            @PathVariable Long verificationId,
            @RequestParam String reason
    ) {
        adminService.rejectOwnerByVerificationId(verificationId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Owner rejected", null));
    }

    @PostMapping("/owners/{ownerId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectOwner(
            @PathVariable Long ownerId,
            @RequestParam String reason
    ) {
        adminService.rejectOwner(ownerId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Owner rejected", null));
    }

    @PostMapping("/owners/{userId}/lock")
    public ResponseEntity<ApiResponse<Void>> lockOwner(
            @PathVariable Long userId,
            @RequestParam String reason
    ) {
        adminService.lockOwner(userId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Owner locked", null));
    }

    @PostMapping("/owners/{userId}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockOwner(
            @PathVariable Long userId,
            @RequestParam(required = false) String reason
    ) {
        adminService.unlockOwner(userId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Owner unlocked", null));
    }

    @GetMapping("/owners/pending")
    public ResponseEntity<ApiResponse<List<OwnerPendingResponse>>> getPendingOwners() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getPendingOwners())
        );
    }

    @GetMapping("/owners/managed")
    public ResponseEntity<ApiResponse<List<OwnerManagedResponse>>> getManagedOwners() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getManagedOwners())
        );
    }

    // ========== field ==========

    @PostMapping("/fields/{fieldId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveField(@PathVariable Long fieldId) {
        adminService.approveField(fieldId);
        return ResponseEntity.ok(
                new ApiResponse<>("Field approved successfully", null)
        );
    }

    @PostMapping("/fields/{fieldId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectField(
            @PathVariable Long fieldId,
            @RequestParam String reason
    ) {
        adminService.rejectField(fieldId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Field rejected", null));
    }

    @PostMapping("/fields/{fieldId}/lock")
    public ResponseEntity<ApiResponse<Void>> lockField(
            @PathVariable Long fieldId,
            @RequestParam String reason
    ) {
        adminService.lockField(fieldId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Field locked", null));
    }

    @PostMapping("/fields/{fieldId}/unlock")
    public ResponseEntity<ApiResponse<Void>> unlockField(
            @PathVariable Long fieldId,
            @RequestParam(required = false) String reason
    ) {
        adminService.unlockField(fieldId, reason);
        return ResponseEntity.ok(new ApiResponse<>("Field unlocked", null));
    }

    @GetMapping("/fields/pending")
    public ResponseEntity<ApiResponse<List<FieldPendingResponse>>> getPendingFields() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getPendingFields())
        );
    }

    // ========== report ==========

    @GetMapping("/reports/pending")
    public ResponseEntity<ApiResponse<List<FieldReportResponse>>> getPendingReports() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getPendingReports())
        );
    }

    @PostMapping("/reports/{reportId}/resolve")
    public ResponseEntity<ApiResponse<Void>> resolveReport(
            @PathVariable Long reportId,
            @RequestParam ReportStatus status
    ) {
        adminService.resolveReport(reportId, status);
        return ResponseEntity.ok(
                new ApiResponse<>("Report resolved: " + status, null)
        );
    }

    @GetMapping("/reports/top-fields")
    public ResponseEntity<ApiResponse<List<FieldReportStat>>> getTopReportedFields() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getMostReportedFields())
        );
    }

    // ========== dashboard ==========

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(
                new ApiResponse<>("Success", adminService.getDashboard())
        );
    }

    // ==== ghi logs ====
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("changedAt").descending());

        List<Map<String, Object>> logs = adminService.getLogs(pageable);

        return ResponseEntity.ok(
                new ApiResponse<>("Get logs success", logs)
        );
    }

    @GetMapping("/logs/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLogStats() {

        Map<String, Object> stats = adminService.getLogStats();

        return ResponseEntity.ok(
                new ApiResponse<>("Get log stats success", stats)
        );
    }
    @GetMapping("/logs/search")
    public ResponseEntity<ApiResponse<Page<AuditLogResponse>>> searchLogs(

            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("changedAt").descending());

        Page<AuditLogEntity> logs = adminService.searchLogs(
                keyword,
                type,
                startDate,
                endDate,
                pageable
        );

        // ✅ MAP ENTITY → DTO (QUAN TRỌNG)
        Page<AuditLogResponse> response = logs.map(this::mapToResponse);

        return ResponseEntity.ok(
                new ApiResponse<>("Search logs success", response)
        );
    }
    private AuditLogResponse mapToResponse(AuditLogEntity log) {

        Instant time = log.getChangedAt() != null
                ? log.getChangedAt().atZone(ZoneId.systemDefault()).toInstant()
                : null;

        return AuditLogResponse.builder()
                .time(time)
                .type(log.getEntityName() != null ? log.getEntityName() : "-")
                .user(log.getChangedBy() != null ? "User #" + log.getChangedBy() : "-")
                .event(log.getAction() != null ? log.getAction().name() : "-")
                .field(log.getEntityId() != null ? String.valueOf(log.getEntityId()) : "-")
                .result(parseResultSafe(log.getNewValue()))
                .build();
    }

    private String parseResultSafe(String newValue) {
        try {
            if (newValue == null) return "-";

            if (newValue.contains("APPROVED")) return "SUCCESS";
            if (newValue.contains("REJECTED")) return "FAILED";
            if (newValue.contains("FAILED")) return "ERROR";

            return "OK";
        } catch (Exception e) {
            return "-";
        }
    }
}

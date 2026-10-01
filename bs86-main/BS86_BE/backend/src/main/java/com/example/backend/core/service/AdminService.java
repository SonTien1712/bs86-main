package com.example.backend.core.service;

import com.example.backend.core.entity.*;
import com.example.backend.core.enums.*;
import com.example.backend.core.repository.*;
import com.example.backend.infrastructure.persistence.jpa.entity.AuditLogEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.AuditLogJpaRepository;
import com.example.backend.presentation.dto.response.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@PreAuthorize("hasRole('ADMIN')")
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final String REGISTRATION_FAILED_REASON = "Đăng ký không thành công";

    private final OwnerVerificationRepository ownerVerRepo;
    private final FieldVerificationRepository fieldVerRepo;
    private final UserRepository userRepo;
    private final FieldRepository fieldRepo;
    private final AuditService auditService;
    private final OwnerProfileRepository ownerProfileRepo;
    private final FieldReportRepository fieldReportRepo;
    private final BookingRepository bookingRepo;
    private final AuditLogJpaRepository auditLogJpaRepo;

    @Autowired
    private ObjectMapper objectMapper;

    // ================ OWNER ==================

    @Transactional
    public void lockOwner(Long userId, String reason) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserStatus oldStatus = user.getStatus();

        user.setStatus(UserStatus.BLOCKED);
        userRepo.save(user);

        auditService.logChange(
                EntityType.USER,
                userId,
                AuditAction.LOCK,
                oldStatus,
                UserStatus.BLOCKED,
                reason
        );
    }

    @Transactional
    public void unlockOwner(Long userId, String reason) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserStatus oldStatus = user.getStatus();

        if (oldStatus != UserStatus.BLOCKED) {
            throw new RuntimeException("Owner is not blocked");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.addRole(Role.OWNER);
        userRepo.save(user);

        ownerProfileRepo.findByUserId(userId).ifPresent(owner ->
                ownerVerRepo.findByOwnerId(owner.getId())
                        .filter(verification -> verification.getStatus() != VerificationStatus.APPROVED)
                        .ifPresent(verification -> {
                            VerificationStatus oldVerificationStatus = verification.getStatus();
                            verification.setOwner(owner);
                            verification.setStatus(VerificationStatus.APPROVED);
                            verification.setRejectionReason(null);
                            verification.setRejectedAt(null);
                            ownerVerRepo.save(verification);

                            auditService.logChange(
                                    EntityType.OWNER,
                                    owner.getId(),
                                    AuditAction.APPROVE,
                                    oldVerificationStatus,
                                    VerificationStatus.APPROVED,
                                    normalizeRejectReason(reason, "Admin active lại owner")
                            );
                        })
        );

        auditService.logChange(
                EntityType.USER,
                userId,
                AuditAction.STATUS_CHANGE,
                oldStatus,
                UserStatus.ACTIVE,
                normalizeRejectReason(reason, "Admin active lại owner")
        );
    }

    @Transactional
    public void rejectOwner(Long ownerId, String reason) {

        OwnerProfile owner = ownerProfileRepo.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        OwnerVerification ownerVeri = owner.getVerification();
        rejectOwnerVerification(ownerVeri, normalizeRejectReason(reason, "Reject owner"));

        ownerProfileRepo.save(owner);
    }

    @Transactional
    public void rejectOwnerByVerificationId(Long verificationId, String reason) {

        OwnerVerification ownerVerification = ownerVerRepo.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Owner verification not found"));

        rejectOwnerVerification(ownerVerification, normalizeRejectReason(reason, "Reject owner verification"));

        ownerVerRepo.save(ownerVerification);
    }

    @Transactional
    public void approveOwnerByVerificationId(Long verificationId) {

        OwnerVerification ov = ownerVerRepo.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Owner verification not found"));

        if (ov.getStatus() == VerificationStatus.APPROVED) {
            throw new RuntimeException("Owner already approved");
        }

        VerificationStatus oldStatus = ov.getStatus();
        ov.setStatus(VerificationStatus.APPROVED);

        User user = ov.getOwner().getUser();
        user.setStatus(UserStatus.ACTIVE);
        user.addRole(Role.OWNER);

        ownerVerRepo.save(ov);
        userRepo.save(user);

        auditService.logChange(
                EntityType.OWNER,
                ov.getOwner().getId(),
                AuditAction.APPROVE,
                oldStatus,
                VerificationStatus.APPROVED,
                "Approve owner"
        );
    }

    public List<OwnerPendingResponse> getPendingOwners() {
        return ownerVerRepo.findByStatus(VerificationStatus.PENDING).stream()
                .map(ov -> OwnerPendingResponse.builder()
                        .id(ov.getId())
                        .ownerEmail(ov.getOwner().getUser().getEmail())
                        .ownerName(ov.getOwner().getUser().getFullName())
                        .phoneNumber(ov.getOwner().getUser().getPhoneNumber())
                        .idCardNumber(ov.getIdCardNumber())
                        .idCardFrontUrl(ov.getIdCardFrontUrl())
                        .idCardBackUrl(ov.getIdCardBackUrl())
                        .businessLicenseUrl(ov.getBusinessLicenseUrl())
                        .attemptCount(ov.getAttemptCount())
                        .build()
                )
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OwnerManagedResponse> getManagedOwners() {
        return userRepo.findAllByRole(Role.OWNER).stream()
                .filter(user -> user.getStatus() == UserStatus.ACTIVE || user.getStatus() == UserStatus.BLOCKED)
                .map(this::toManagedOwnerResponse)
                .toList();
    }

    public List<FieldPendingResponse> getPendingFields() {
        return fieldVerRepo.findByStatus(VerificationStatus.PENDING).stream()
                .map(fv -> FieldPendingResponse.builder()
                        .id(fv.getId())
                        .fieldId(fv.getField().getId())
                        .fieldName(fv.getField().getName())
                        .address(fv.getField().getAddress())
                        .landCertificateUrl(fv.getLandCertificateUrl())
                        .fieldImagesUrl(fv.getFieldImagesUrl())
                        .build()
                )
                .toList();
    }

    // ============== FIELD ================

    @Transactional
    public void approveField(Long fieldId) {

        FieldVerification fv = fieldVerRepo.findByFieldId(fieldId)
                .orElseThrow(() -> new RuntimeException("Field verification not found"));

        if (fv.getStatus() == VerificationStatus.APPROVED) {
            throw new RuntimeException("Field already approved");
        }

        VerificationStatus oldStatus = fv.getStatus();
        fv.setStatus(VerificationStatus.APPROVED);

        Field field = fv.getField();
        field.setStatus(FieldStatus.ACTIVE);

        if (field.getVerification() != null) {
            field.getVerification().setStatus(VerificationStatus.APPROVED);
        }

        fieldVerRepo.save(fv);
        fieldRepo.save(field);

        auditService.logChange(
                EntityType.FIELD,
                fieldId,
                AuditAction.APPROVE,
                oldStatus,
                VerificationStatus.APPROVED,
                "Approve field"
        );
    }

    @Transactional
    public void rejectField(Long fieldId, String reason) {

        FieldVerification fv = fieldVerRepo.findByFieldId(fieldId)
                .orElseThrow(() -> new RuntimeException("Field verification not found"));

        VerificationStatus oldStatus = fv.getStatus();

        fv.setStatus(VerificationStatus.REJECTED);

        Field field = fv.getField();
        field.setStatus(FieldStatus.INACTIVE);

        fieldVerRepo.save(fv);
        fieldRepo.save(field);

        auditService.logChange(
                EntityType.FIELD,
                fieldId,
                AuditAction.REJECT,
                oldStatus,
                VerificationStatus.REJECTED,
                normalizeRejectReason(reason, "Reject field")
        );
    }

    @Transactional
    public void lockField(Long fieldId, String reason) {

        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        FieldStatus oldStatus = field.getStatus();

        field.setStatus(FieldStatus.INACTIVE);
        fieldRepo.save(field);

        auditService.logChange(
                EntityType.FIELD,
                fieldId,
                AuditAction.LOCK,
                oldStatus,
                FieldStatus.INACTIVE,
                reason
        );
    }

    @Transactional
    public void unlockField(Long fieldId, String reason) {

        Field field = fieldRepo.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));

        FieldStatus oldStatus = field.getStatus();

        if (oldStatus != FieldStatus.INACTIVE) {
            throw new RuntimeException("Field is not locked");
        }

        FieldVerification fv = fieldVerRepo.findByFieldId(fieldId)
                .orElseThrow(() -> new RuntimeException("Field verification not found"));

        if (fv.getStatus() == VerificationStatus.APPROVED) {
            field.setStatus(FieldStatus.ACTIVE);
        } else {
            field.setStatus(FieldStatus.INACTIVE);
        }

        fieldRepo.save(field);

        auditService.logChange(
                EntityType.FIELD,
                fieldId,
                AuditAction.UPDATE,
                oldStatus,
                field.getStatus(),
                reason != null ? reason : "Unlock field"
        );
    }

    @Transactional(readOnly = true)
    public List<FieldReportResponse> getPendingReports() {
        return fieldReportRepo.findReportResponsesByStatus(ReportStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<FieldReportStat> getMostReportedFields() {
        return fieldReportRepo.countReportsByField();
    }

    @Transactional
    public void resolveReport(Long reportId, ReportStatus status) {

        FieldReport report = fieldReportRepo.findById(reportId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Report not found"
                ));

        if (report.getStatus() != ReportStatus.PENDING) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Report already resolved"
            );
        }

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(status);

        Field field = null;

        if (status == ReportStatus.APPROVED) {

            if (report.getFieldId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Report missing fieldId"
                );
            }

            field = fieldRepo.findById(report.getFieldId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Field not found"
                    ));

            field.setStatus(FieldStatus.INACTIVE);
            fieldRepo.save(field);
        }

        fieldReportRepo.save(report);

        auditService.logChange(
                EntityType.REPORT,
                reportId,
                AuditAction.UPDATE,
                oldStatus,
                status,
                status == ReportStatus.APPROVED
                        ? "Admin APPROVED report => LOCK field " + (field != null ? field.getId() : "N/A")
                        : "Admin REJECTED report #" + reportId
        );
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {

        return AdminDashboardResponse.builder()
                .totalUsers(userRepo.count())
                .totalOwners(userRepo.countOwners())
                .totalFields(fieldRepo.countField())
                .totalBookings(bookingRepo.countBooking())

                .pendingOwners(ownerVerRepo.countByStatus(VerificationStatus.PENDING))
                .pendingFields(fieldVerRepo.countByStatus(VerificationStatus.PENDING))
                .pendingReports(fieldReportRepo.countByStatus(ReportStatus.PENDING))

                .totalRevenue(bookingRepo.getTotalRevenue())
                .topReportedFields(fieldReportRepo.countReportsByField())
                .build();
    }

    // ============== AUDIT LOG ==============

    public List<Map<String, Object>> getLogs(Pageable pageable) {

        return auditLogJpaRepo.findAll(pageable)
                .stream()
                .map(log -> {

                    Map<String, Object> map = new HashMap<>();

                    // ================= TIME =================
                    map.put("time",
                            log.getChangedAt() != null
                                    ? log.getChangedAt().toString()
                                    : null
                    );

                    // ================= USER =================
                    map.put("user", buildUserDisplay(log.getChangedBy()));

                    try {
                        Map<String, Object> extra =
                                objectMapper.readValue(log.getNewValue(), Map.class);

                        // ================= TYPE =================
                        map.put("type",
                                extra.getOrDefault("type", log.getEntityName())
                        );

                        // ================= RESULT =================
                        map.put("result",
                                extra.getOrDefault("result", "SUCCESS")
                        );

                        // ================= FIELD (FIX QUAN TRỌNG) =================
                        map.put("field",
                                extra.getOrDefault(
                                        "field",
                                        extra.getOrDefault(
                                                "target",
                                                log.getEntityId()
                                        )
                                )
                        );

                    } catch (Exception e) {

                        map.put("type", log.getEntityName());
                        map.put("result", "SUCCESS");
                        map.put("field", log.getEntityId());
                    }

                    // ================= EVENT =================
                    map.put("event", buildEvent(log));

                    return map;
                })
                .toList();
    }

    public Map<String, Object> getLogStats() {

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<AuditLogEntity> logs =
                auditLogJpaRepo.findByChangedAtBetween(startOfDay, LocalDateTime.now());

        return Map.of(
                "totalToday", logs.size(),
                "systemErrors", logs.stream()
                        .filter(l -> l.getNewValue() != null && l.getNewValue().contains("FAILED"))
                        .count()
        );
    }

    public Page<AuditLogEntity> searchLogs(String keyword,
                                           String type,
                                           LocalDateTime start,
                                           LocalDateTime end,
                                           Pageable pageable) {

        return auditLogJpaRepo.searchLogs(keyword, type, start, end, pageable);
    }

    private String buildUserDisplay(Long userId) {

        if (userId == null) return "SYSTEM";

        return userRepo.findById(userId)
                .map(user -> {

                    boolean isAdmin = user.getRoles().stream()
                            .anyMatch(r -> r.getRole().name().equals("ADMIN"));

                    if (isAdmin) {
                        return "Admin (" + user.getEmail() + ")";
                    }

                    return user.getFullName() + " - " + user.getPhoneNumber();
                })
                .orElse("Unknown");
    }

    private String buildEvent(AuditLogEntity log) {

        String entity = log.getEntityName();
        String action = log.getAction().name();

        if (entity.equals("BOOKING") && action.equals("CREATE")) return "Đặt sân";
        if (entity.equals("FIELD") && action.equals("APPROVE")) return "Duyệt sân";
        if (entity.equals("FIELD") && action.equals("LOCK")) return "Khóa sân";
        if (entity.equals("OWNER") && action.equals("APPROVE")) return "Duyệt chủ sân";
        if (entity.equals("REPORT") && action.equals("UPDATE")) return "Xử lý báo cáo";

        return action;
    }

    private void rejectOwnerVerification(OwnerVerification ownerVerification, String reason) {

        if (ownerVerification == null) {
            throw new RuntimeException("Owner verification not found");
        }

        VerificationStatus oldStatus = ownerVerification.getStatus();
        ownerVerification.setStatus(VerificationStatus.REJECTED);
        ownerVerification.setRejectionReason(reason);
        ownerVerification.setRejectedAt(LocalDateTime.now());

        Long ownerId = ownerVerification.getOwner() != null
                ? ownerVerification.getOwner().getId()
                : null;

        User user = ownerVerification.getOwner() != null
                ? ownerVerification.getOwner().getUser()
                : null;

        if (user != null && ownerVerification.getAttemptCount() >= 3) {
            UserStatus oldUserStatus = user.getStatus();
            user.setStatus(UserStatus.BLOCKED);
            userRepo.save(user);

            auditService.logChange(
                    EntityType.USER,
                    user.getId(),
                    AuditAction.LOCK,
                    oldUserStatus,
                    UserStatus.BLOCKED,
                    REGISTRATION_FAILED_REASON
            );
        }

        auditService.logChange(
                EntityType.OWNER,
                ownerId,
                AuditAction.REJECT,
                oldStatus,
                VerificationStatus.REJECTED,
                reason
        );
    }

    private String normalizeRejectReason(String reason, String fallback) {
        return (reason == null || reason.isBlank()) ? fallback : reason.trim();
    }

    private OwnerManagedResponse toManagedOwnerResponse(User user) {
        OwnerProfile owner = ownerProfileRepo.findByUserId(user.getId()).orElse(null);
        Long ownerId = owner != null ? owner.getId() : null;
        String reason = resolveOwnerReason(user, ownerId);
        int fieldCount = ownerId != null ? fieldRepo.findByOwnerId(ownerId).size() : 0;

        return OwnerManagedResponse.builder()
                .id(user.getId())
                .ownerId(ownerId)
                .ownerEmail(user.getEmail())
                .ownerName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .reason(reason)
                .fieldCount(fieldCount)
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String resolveOwnerReason(User user, Long ownerId) {
        if (user.getStatus() != UserStatus.BLOCKED) {
            return null;
        }

        return auditLogJpaRepo
                .findFirstByEntityNameAndEntityIdAndActionOrderByChangedAtDesc(
                        EntityType.USER.name(),
                        user.getId(),
                        AuditAction.LOCK
                )
                .map(AuditLogEntity::getReason)
                .filter(Objects::nonNull)
                .filter(value -> !value.isBlank())
                .orElseGet(() -> resolveRejectedRegistrationReason(ownerId));
    }

    private String resolveRejectedRegistrationReason(Long ownerId) {
        if (ownerId == null) {
            return REGISTRATION_FAILED_REASON;
        }

        return ownerVerRepo.findByOwnerId(ownerId)
                .filter(verification -> verification.getStatus() == VerificationStatus.REJECTED)
                .map(OwnerVerification::getRejectionReason)
                .filter(Objects::nonNull)
                .filter(value -> !value.isBlank())
                .orElse(REGISTRATION_FAILED_REASON);
    }
}

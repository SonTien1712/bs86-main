package com.example.backend.core.service;

import com.example.backend.core.entity.Field;
import com.example.backend.core.entity.FieldReport;
import com.example.backend.core.repository.FieldReportRepository;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldReportJpaRepository;
import com.example.backend.core.enums.ReportStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FieldReportService {
    private final FieldRepository fieldRepository;
    private final FieldReportRepository fieldReportRepo;
    private final FieldReportJpaRepository fieldReportJpaRepository;

    @Transactional
    public void createReport(Long fieldId, String reason, String reportBy) {

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Reason must not be empty");
        }

        // check field tồn tại
        Field field = fieldRepository.findById(fieldId)
                .orElseThrow(() -> new RuntimeException("Field not found"));


        // anti-spam
        boolean exists = fieldReportJpaRepository
                .existsByFieldIdAndReportByAndStatus(
                        fieldId,
                        reportBy,
                        ReportStatus.PENDING
                );

        if (exists) {
            throw new IllegalStateException("You already reported this field");
        }

        FieldReport report = FieldReport.builder()
                .fieldId(field.getId()) // dùng từ object luôn
                .reason(reason)
                .reportBy(reportBy)
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        fieldReportRepo.save(report);
    }
}


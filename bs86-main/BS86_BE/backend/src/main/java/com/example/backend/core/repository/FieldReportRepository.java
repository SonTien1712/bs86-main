package com.example.backend.core.repository;

import com.example.backend.core.entity.FieldReport;
import com.example.backend.core.enums.ReportStatus;
import com.example.backend.presentation.dto.response.FieldReportResponse;
import com.example.backend.presentation.dto.response.FieldReportStat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

public interface FieldReportRepository {

    FieldReport save(FieldReport report);

    Optional<FieldReport> findById(Long id);

    Page<FieldReport> findByStatus(ReportStatus status, Pageable pageable);

    List<FieldReportStat> countReportsByField();

    List<FieldReportResponse> findReportResponsesByStatus(ReportStatus status);

    long countByStatus(ReportStatus status);
}

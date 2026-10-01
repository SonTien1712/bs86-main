package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.ReportStatus;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldReportEntity;
import com.example.backend.presentation.dto.response.FieldReportResponse;
import com.example.backend.presentation.dto.response.FieldReportStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface FieldReportJpaRepository extends JpaRepository<FieldReportEntity, Long> {

    Page<FieldReportEntity> findByStatus(ReportStatus status, Pageable pageable);

    @Query("""
        SELECT new com.example.backend.presentation.dto.response.FieldReportResponse(
            fr.id,
            fr.fieldId,
            f.name,
            fr.reason,
            fr.status,
            fr.createdAt
        )
        FROM FieldReportEntity fr
        JOIN FieldEntity f ON fr.fieldId = f.id
        WHERE fr.status = :status
    """)
    List<FieldReportResponse> findReportResponsesByStatus(ReportStatus status);

    @Query("""
        SELECT new com.example.backend.presentation.dto.response.FieldReportStat(
            fr.fieldId,
            COUNT(fr)
        )
        FROM FieldReportEntity fr
        GROUP BY fr.fieldId
        ORDER BY COUNT(fr) DESC
    """)
    List<FieldReportStat> countReportsByField();

    long countByStatus(ReportStatus status);

    boolean existsByFieldIdAndReportByAndStatus(
            Long fieldId,
            String reportBy,
            ReportStatus status
    );
}

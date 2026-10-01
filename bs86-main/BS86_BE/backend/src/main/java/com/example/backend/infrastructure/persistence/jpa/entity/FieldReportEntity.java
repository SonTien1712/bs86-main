package com.example.backend.infrastructure.persistence.jpa.entity;

import com.example.backend.core.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "field_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FieldReportEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long fieldId;
    private String reportBy;
    private String reason;

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    private LocalDateTime createdAt;
}

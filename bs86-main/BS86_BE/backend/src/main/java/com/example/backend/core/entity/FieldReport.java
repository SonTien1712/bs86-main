package com.example.backend.core.entity;

import com.example.backend.core.enums.ReportStatus;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldReport {
    private Long id;
    private Long fieldId;
    private String reportBy;
    private String reason;
    private ReportStatus status;
    private LocalDateTime createdAt;
}

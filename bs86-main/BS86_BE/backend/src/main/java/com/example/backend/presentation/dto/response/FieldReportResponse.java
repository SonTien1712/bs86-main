package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldReportResponse {

    private Long reportId;
    private Long fieldId;
    private String fieldName;
    private String reason;
    private ReportStatus status;
    private LocalDateTime createdAt;
}
package com.example.backend.presentation.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateFieldReportRequest {
    private Long fieldId;
    private String reason;
}
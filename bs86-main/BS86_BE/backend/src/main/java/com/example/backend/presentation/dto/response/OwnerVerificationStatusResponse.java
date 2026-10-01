package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerVerificationStatusResponse {
    private String status;
    private String rejectionReason;
    /** 1–3 = attempt number; 0 = no verification record (status "NONE") */
    private int attemptCount;
}

package com.example.backend.core.entity;

import com.example.backend.core.enums.VerificationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class OwnerVerification {

    private Long id;

    private OwnerProfile owner;

    private String idCardNumber;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String businessLicenseUrl;

    private VerificationStatus status;

    private String rejectionReason;
    private LocalDateTime rejectedAt;

    /** 1 = first submission (registration), 2 = first resubmit, 3 = last chance */
    private int attemptCount;
}

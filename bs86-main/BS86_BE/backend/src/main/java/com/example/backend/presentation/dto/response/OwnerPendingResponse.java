package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OwnerPendingResponse {
    private Long id;
    private String ownerEmail;
    private String ownerName;
    private String phoneNumber;
    private String idCardNumber;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String businessLicenseUrl;
    /** 1 = normal, 2 = orange warning, 3 = red (last chance) */
    private int attemptCount;
}

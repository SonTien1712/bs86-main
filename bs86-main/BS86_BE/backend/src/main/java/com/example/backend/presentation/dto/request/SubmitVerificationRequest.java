package com.example.backend.presentation.dto.request;

import lombok.Data;

@Data
public class SubmitVerificationRequest {
    private String idCardNumber;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String businessLicenseUrl;


}

package com.example.backend.core.entity;

import com.example.backend.core.enums.VerificationStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FieldVerification {

    private Long id;
    private Field field;

    private String landCertificateUrl;
    private String fieldImagesUrl;
    private VerificationStatus status;
}

package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FieldPendingResponse {

    private Long id;
    private Long fieldId;
    private String fieldName;
    private String address;
    private String landCertificateUrl;
    private String fieldImagesUrl;
}

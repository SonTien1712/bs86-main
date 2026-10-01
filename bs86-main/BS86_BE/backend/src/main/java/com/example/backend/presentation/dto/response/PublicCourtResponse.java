package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PublicCourtResponse {
    private Long id;
    private String name;
    private Long fieldId;
    private String courtGroup;
    private String status;
}

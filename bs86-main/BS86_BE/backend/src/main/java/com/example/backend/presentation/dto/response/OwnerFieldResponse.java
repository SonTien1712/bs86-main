package com.example.backend.presentation.dto.response;

import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.enums.SportType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OwnerFieldResponse {
    private Long id;
    private String name;
    private String slug;
    private String address;
    private SportType sportType;
    private FieldStatus status;
    private Double latitude;
    private Double longitude;
    private String openingHours;
    private String coverImageUrl;
}

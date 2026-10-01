package com.example.backend.presentation.dto.request;

import com.example.backend.core.enums.SportType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFieldRequest {
    private String fieldName;
    private String address;
    private Double latitude;
    private Double longitude;
    private SportType sportType;
}
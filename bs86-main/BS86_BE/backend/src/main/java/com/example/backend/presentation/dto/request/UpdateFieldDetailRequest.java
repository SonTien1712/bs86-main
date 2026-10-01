package com.example.backend.presentation.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateFieldDetailRequest {
    private String description;
    private String phone;
    private String openingHours;
    private String bookingPolicy;
    private String coverImageUrl;
}

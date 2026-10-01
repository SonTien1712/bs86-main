package com.example.backend.core.entity;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FieldDetail {

    private Long id;
    private Long fieldId;

    private String description;
    private String phone;
    private String openingHours;
    private String bookingPolicy;
    private String coverImageUrl;
}

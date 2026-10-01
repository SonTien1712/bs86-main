package com.example.backend.presentation.dto.request;

import com.example.backend.core.enums.DayType;
import lombok.Data;

import java.time.LocalTime;

@Data
public class SetTemplateRequest {

    private DayType dayType;

    private LocalTime openTime;

    private LocalTime closeTime;

    private int slotMinutes;

    private Long basePrice;
}



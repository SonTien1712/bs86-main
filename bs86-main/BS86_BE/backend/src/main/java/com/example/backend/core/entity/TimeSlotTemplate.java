package com.example.backend.core.entity;

import com.example.backend.core.enums.DayType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class TimeSlotTemplate {

    private Long id;

    private Court court;

    private DayType dayType;

    private LocalTime openTime;

    private LocalTime closeTime;

    private int slotMinutes;

    private Long basePrice;
}

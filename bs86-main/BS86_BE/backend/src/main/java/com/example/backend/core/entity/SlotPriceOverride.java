package com.example.backend.core.entity;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class SlotPriceOverride {

    private Long id;

    private Long courtId; // 🔥 đổi sang ID

    private LocalDate date;

    private LocalTime startTime;

    private Long overridePrice;
}

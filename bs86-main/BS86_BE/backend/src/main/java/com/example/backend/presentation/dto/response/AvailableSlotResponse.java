package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class AvailableSlotResponse {
    private Long slotId;
    private LocalDate date;
    private Long courtId;
    private String courtName;
    private LocalTime startTime;
    private LocalTime endTime;
}

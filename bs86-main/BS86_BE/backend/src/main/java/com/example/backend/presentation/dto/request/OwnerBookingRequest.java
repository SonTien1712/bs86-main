package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class OwnerBookingRequest {
    @NotNull
    private LocalDate bookingDate;

    @NotEmpty
    private List<LocalTime> startTimes;
}

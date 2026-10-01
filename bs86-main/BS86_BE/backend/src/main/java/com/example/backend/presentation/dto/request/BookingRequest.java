package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Data
public class BookingRequest {

    @NotNull
    private Long courtId;
    @NotNull
    private LocalDate bookingDate;
    @NotEmpty
    private List<LocalTime> startTimes;
}

package com.example.backend.presentation.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class CourtSlotResponse {

    private Long id;

    private LocalTime startTime;

    private LocalTime endTime;

    private BigDecimal price;

    private String status;
}
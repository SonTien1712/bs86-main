package com.example.backend.presentation.dto.request;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class OverridePriceRequest {

    private LocalDate date;

    private List<LocalTime> times;

    private Long price;
}
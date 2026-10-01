package com.example.backend.presentation.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class GenerateSlotRequest {

    private LocalDate date;
}

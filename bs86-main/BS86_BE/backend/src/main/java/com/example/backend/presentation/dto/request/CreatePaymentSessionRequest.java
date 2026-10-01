package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreatePaymentSessionRequest {
    @NotEmpty
    private List<Long> slotIds;

    @NotBlank
    private String paymentMethod;
}

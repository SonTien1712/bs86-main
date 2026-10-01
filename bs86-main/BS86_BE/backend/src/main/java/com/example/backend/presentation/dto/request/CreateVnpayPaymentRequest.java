package com.example.backend.presentation.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateVnpayPaymentRequest {
    @NotNull
    private Long bookingId;
}

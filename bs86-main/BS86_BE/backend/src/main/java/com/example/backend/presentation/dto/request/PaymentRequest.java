package com.example.backend.presentation.dto.request;

import lombok.Data;

@Data
public class PaymentRequest {
    private Long bookingId;
    private String paymentMethod; // VNPAY, CASH,...
}

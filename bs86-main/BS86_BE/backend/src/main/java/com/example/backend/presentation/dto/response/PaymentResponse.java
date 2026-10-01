package com.example.backend.presentation.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
@Data
public class PaymentResponse {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long courtId;
    private Long fieldId;
    private Double amount;
    private String status;
    private String paymentStatus;
    private String bookingStatus;
    private String paymentMethod;
    private String transactionId;
    private String orderCode;
    private String paymentUrl;
    private String redirectUrl;
    private String responseCode;
    private String responseMessage;
    private String failReason;
    private LocalDateTime expiresAt;
    private boolean paid;
}

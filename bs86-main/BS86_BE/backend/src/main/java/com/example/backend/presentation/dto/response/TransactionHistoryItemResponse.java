package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class TransactionHistoryItemResponse {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long fieldId;
    private Long courtId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal amount;
    private String paymentMethod;
    private String paymentStatus;
    private String bookingStatus;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private String orderCode;
    private String gatewayTransactionId;
    private String message;
    private String failReason;
}

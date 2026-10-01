package com.example.backend.presentation.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
public class TransactionDetailResponse {
    private Long id;
    private Long bookingId;
    private Long userId;
    private Long ownerProfileId;
    private Long fieldId;
    private Long courtId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BigDecimal amount;
    private String paymentMethod;
    private String transactionStatus;
    private String bookingStatus;
    private String paymentStatus;
    private String transactionCode;
    private String gatewayOrderCode;
    private String gatewayTransactionId;
    private String gatewayReference;
    private String paymentUrl;
    private String responseCode;
    private String responseMessage;
    private String failReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime paidAt;
}

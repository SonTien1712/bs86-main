package com.example.backend.core.entity;

import com.example.backend.core.enums.PaymentMethod;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.core.enums.TransactionType;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
public class Transaction {
    private Long id;
    private Booking booking;
    private Long userId;
    private Long ownerProfileId;
    private Long fieldId;
    private Long courtId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String transactionCode;
    private String gatewayOrderCode;
    private TransactionType transactionType;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private TransactionStatus status;
    private String paymentUrl;
    private String bankCode;
    private String gatewayTransactionId;
    private String gatewayReference;
    private String responseCode;
    private String responseMessage;
    private String failReason;
    private String description;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

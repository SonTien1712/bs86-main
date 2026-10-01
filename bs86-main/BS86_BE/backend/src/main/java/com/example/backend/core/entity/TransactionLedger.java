package com.example.backend.core.entity;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class TransactionLedger {
    private Long id;
    private Long bookingId;
    private String transactionType;
    private String debitAccountType;
    private Long debitAccountId;
    private String creditAccountType;
    private Long creditAccountId;
    private BigDecimal amount;
    private String description;
    private String referenceId;
    private Long createdBy;
    private LocalDateTime createdAt;
}

package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayoutRequestResponse {
    private Long id;
    private Long ownerId;
    private String ownerEmail;
    private BigDecimal amount;
    private String status;
    private String ownerNote;
    private String adminNote;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String payoutReference;
    private String reviewedByEmail;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

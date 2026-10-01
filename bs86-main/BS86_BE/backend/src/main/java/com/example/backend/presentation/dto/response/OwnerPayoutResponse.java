package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerPayoutResponse {
    private Long ownerId;
    private String referenceId;
    private BigDecimal amount;
    private BigDecimal remainingBalance;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
}

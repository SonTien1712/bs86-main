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
public class OwnerFinanceSummaryResponse {
    private Long ownerId;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private boolean payoutEnabled;
    private BigDecimal totalRevenue;
    private BigDecimal totalPayableBalance;
    private BigDecimal availablePayoutBalance;
    private BigDecimal pendingPayoutRequestAmount;
    private BigDecimal pendingPayoutBalance;
    private BigDecimal settledAmount;
    private BigDecimal platformCommissionRate;
    private BigDecimal ownerShareRate;
    private BigDecimal minimumPayoutAmount;
}

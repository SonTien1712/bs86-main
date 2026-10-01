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
public class AdminFinanceSummaryResponse {
    private BigDecimal platformEscrowBalance;
    private BigDecimal platformRevenue;
    private BigDecimal merchantPayableBalance;
    private BigDecimal merchantSettledAmount;
    private BigDecimal platformCommissionRate;
    private BigDecimal ownerShareRate;
    private BigDecimal minimumPayoutAmount;
    private Long pendingPayoutRequests;
    private BigDecimal pendingPayoutRequestAmount;
}

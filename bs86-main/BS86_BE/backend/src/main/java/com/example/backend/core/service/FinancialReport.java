package com.example.backend.core.service;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Map;

@Getter
@Builder
public class FinancialReport {
    private final YearMonth month;
    private final BigDecimal totalBookingRevenue;
    private final BigDecimal totalCommission;
    private final BigDecimal totalRefund;
    private final BigDecimal netRevenue;
    private final Map<Long, BigDecimal> revenueByMerchant;
    private final LocalDateTime generatedAt;
}


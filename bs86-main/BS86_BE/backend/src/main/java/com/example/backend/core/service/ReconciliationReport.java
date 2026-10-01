package com.example.backend.core.service;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class ReconciliationReport {
    private Long merchantId;
    private LocalDate date;
    private BigDecimal expectedRevenue;
    private BigDecimal actualRevenue;
    private BigDecimal discrepancy;
    private boolean reconciled;
}


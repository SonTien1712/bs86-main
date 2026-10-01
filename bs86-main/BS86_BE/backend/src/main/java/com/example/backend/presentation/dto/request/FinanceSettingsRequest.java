package com.example.backend.presentation.dto.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class FinanceSettingsRequest {
    private BigDecimal platformCommissionRate;
    private BigDecimal minimumPayoutAmount;
}

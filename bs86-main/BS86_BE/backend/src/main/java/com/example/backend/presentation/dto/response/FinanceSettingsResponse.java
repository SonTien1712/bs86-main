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
public class FinanceSettingsResponse {
    private BigDecimal platformCommissionRate;
    private BigDecimal ownerShareRate;
    private BigDecimal minimumPayoutAmount;
}

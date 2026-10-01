package com.example.backend.core.entity;

import com.example.backend.core.enums.WithdrawalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WithdrawalRequest {
    private Long id;
    private Long merchantId;
    private Long bankAccountId;
    private BigDecimal amount;
    @Builder.Default private BigDecimal fee = new BigDecimal("3300");
    private BigDecimal netAmount;
    @Builder.Default private WithdrawalStatus status = WithdrawalStatus.PENDING;
    private String adminNote;
    private Long approvedBy;
    private Long createdAt;
    private Long updatedAt;
}

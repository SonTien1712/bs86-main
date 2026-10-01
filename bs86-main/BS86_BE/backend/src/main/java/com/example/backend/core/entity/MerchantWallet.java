package com.example.backend.core.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MerchantWallet {
    private Long id;
    private Long merchantId;
    @Builder.Default private BigDecimal availableBalance = BigDecimal.ZERO;
    @Builder.Default private BigDecimal frozenBalance = BigDecimal.ZERO;
    private Long version;
    private Long updatedAt;
}

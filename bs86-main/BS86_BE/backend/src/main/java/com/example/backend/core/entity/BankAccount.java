package com.example.backend.core.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankAccount {
    private Long id;
    private Long merchantId;
    private String bankName;
    private String accountNumber;
    private String accountHolderName;
    @Builder.Default private Boolean isDefault = false;
    private Long createdAt;
}

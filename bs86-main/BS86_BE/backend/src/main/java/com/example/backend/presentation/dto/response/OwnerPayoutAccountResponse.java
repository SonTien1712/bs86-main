package com.example.backend.presentation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerPayoutAccountResponse {
    private Long ownerId;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private boolean payoutEnabled;
}

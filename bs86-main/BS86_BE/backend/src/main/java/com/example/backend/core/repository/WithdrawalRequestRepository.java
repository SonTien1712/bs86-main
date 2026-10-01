package com.example.backend.core.repository;

import com.example.backend.core.entity.WithdrawalRequest;
import com.example.backend.core.enums.WithdrawalStatus;

import java.util.List;
import java.util.Optional;

public interface WithdrawalRequestRepository {
    WithdrawalRequest save(WithdrawalRequest request);
    Optional<WithdrawalRequest> findById(Long id);
    List<WithdrawalRequest> findByMerchantId(Long merchantId);
    List<WithdrawalRequest> findByStatus(WithdrawalStatus status);
    List<WithdrawalRequest> findProcessingOlderThan(Long timestampThreshold);
}

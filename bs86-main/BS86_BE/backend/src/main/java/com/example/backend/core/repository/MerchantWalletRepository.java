package com.example.backend.core.repository;

import com.example.backend.core.entity.MerchantWallet;

import java.math.BigDecimal;
import java.util.Optional;

public interface MerchantWalletRepository {
    MerchantWallet save(MerchantWallet wallet);
    Optional<MerchantWallet> findByMerchantId(Long merchantId);
    boolean lockBalanceForWithdrawal(Long merchantId, BigDecimal amount);
    void creditAvailableBalance(Long merchantId, BigDecimal amount);
    void confirmWithdrawal(Long merchantId, BigDecimal amount);
    void rollbackWithdrawal(Long merchantId, BigDecimal amount);
}

package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.MerchantWallet;
import com.example.backend.core.repository.MerchantWalletRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.MerchantWalletJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.MerchantWalletMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class MerchantWalletRepositoryAdapter implements MerchantWalletRepository {

    private final MerchantWalletJpaRepository jpa;
    private final MerchantWalletMapper mapper;

    @Override
    public MerchantWallet save(MerchantWallet wallet) {
        return mapper.toDomain(jpa.save(mapper.toEntity(wallet)));
    }

    @Override
    public Optional<MerchantWallet> findByMerchantId(Long merchantId) {
        return jpa.findByMerchantId(merchantId).map(mapper::toDomain);
    }

    @Override
    public boolean lockBalanceForWithdrawal(Long merchantId, BigDecimal amount) {
        return jpa.lockBalanceForWithdrawal(merchantId, amount) > 0;
    }

    @Override
    public void creditAvailableBalance(Long merchantId, BigDecimal amount) {
        jpa.creditAvailableBalance(merchantId, amount);
    }

    @Override
    public void confirmWithdrawal(Long merchantId, BigDecimal amount) {
        jpa.confirmWithdrawal(merchantId, amount);
    }

    @Override
    public void rollbackWithdrawal(Long merchantId, BigDecimal amount) {
        jpa.rollbackWithdrawal(merchantId, amount);
    }
}

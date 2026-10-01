package com.example.backend.core.service;

import com.example.backend.core.entity.MerchantWallet;
import com.example.backend.core.repository.MerchantWalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantWalletService {

    private final MerchantWalletRepository walletRepository;

    @Transactional
    public MerchantWallet initializeWallet(Long merchantId) {
        return walletRepository.findByMerchantId(merchantId)
                .orElseGet(() -> walletRepository.save(
                        MerchantWallet.builder().merchantId(merchantId).build()));
    }

    @Transactional
    public void creditMerchantBalance(Long merchantId, BigDecimal amount) {
        // TODO: Extract to MoneyCreditedEvent for event-driven architecture
        walletRepository.creditAvailableBalance(merchantId, amount);
        log.info("[Wallet] Credited {} to merchant {}", amount, merchantId);
    }

    public MerchantWallet getBalance(Long merchantId) {
        return walletRepository.findByMerchantId(merchantId)
                .orElseThrow(() -> new RuntimeException("Wallet not found for merchant: " + merchantId));
    }
}

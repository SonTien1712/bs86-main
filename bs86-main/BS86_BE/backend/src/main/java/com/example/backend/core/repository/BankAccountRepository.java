package com.example.backend.core.repository;

import com.example.backend.core.entity.BankAccount;

import java.util.List;
import java.util.Optional;

public interface BankAccountRepository {
    BankAccount save(BankAccount account);
    Optional<BankAccount> findById(Long id);
    List<BankAccount> findByMerchantId(Long merchantId);
    Optional<BankAccount> findDefaultByMerchantId(Long merchantId);
}

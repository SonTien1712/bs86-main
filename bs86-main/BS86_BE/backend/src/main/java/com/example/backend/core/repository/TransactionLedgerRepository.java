package com.example.backend.core.repository;

import com.example.backend.core.entity.TransactionLedger;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionLedgerRepository {
        TransactionLedger save(TransactionLedger ledger);

        Optional<TransactionLedger> findById(Long id);

        List<TransactionLedger> findAll();

        BigDecimal sumByAccountAndDate(String accountType, Long accountId, LocalDateTime start, LocalDateTime end);

    BigDecimal sumByTypeAndDateRange(String type, LocalDateTime start, LocalDateTime end);

    List<Object[]> sumByAccountTypeAndDateRange(String accountType, LocalDateTime start, LocalDateTime end);

    BigDecimal sumCreditsByAccount(String accountType, Long accountId);

    BigDecimal sumDebitsByAccount(String accountType, Long accountId);

    BigDecimal sumCreditsByAccountType(String accountType);

    BigDecimal sumDebitsByAccountType(String accountType);
}

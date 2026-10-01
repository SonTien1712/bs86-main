package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.TransactionLedger;
import com.example.backend.core.repository.TransactionLedgerRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionLedgerEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.TransactionLedgerJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.TransactionLedgerMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TransactionLedgerRepositoryAdapter implements TransactionLedgerRepository {
    private final TransactionLedgerJpaRepository repo;
    private final TransactionLedgerMapper mapper;

    @Override
    public TransactionLedger save(TransactionLedger ledger) {
        return mapper.toDomain(repo.save(mapper.toEntity(ledger)));
    }

    @Override
    public Optional<TransactionLedger> findById(Long id) {
        return repo.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<TransactionLedger> findAll() {
        return repo.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public BigDecimal sumByAccountAndDate(String accountType, Long accountId, LocalDateTime start, LocalDateTime end) {
        return repo.sumByAccountAndDate(accountType, accountId, start, end);
    }

    @Override
    public BigDecimal sumByTypeAndDateRange(String type, LocalDateTime start, LocalDateTime end) {
        return repo.sumByTypeAndDateRange(type, start, end);
    }

    @Override
    public List<Object[]> sumByAccountTypeAndDateRange(String accountType, LocalDateTime start, LocalDateTime end) {
        return repo.sumByAccountTypeAndDateRange(accountType, start, end);
    }

    @Override
    public BigDecimal sumCreditsByAccount(String accountType, Long accountId) {
        return repo.sumCreditsByAccount(accountType, accountId);
    }

    @Override
    public BigDecimal sumDebitsByAccount(String accountType, Long accountId) {
        return repo.sumDebitsByAccount(accountType, accountId);
    }

    @Override
    public BigDecimal sumCreditsByAccountType(String accountType) {
        return repo.sumCreditsByAccountType(accountType);
    }

    @Override
    public BigDecimal sumDebitsByAccountType(String accountType) {
        return repo.sumDebitsByAccountType(accountType);
    }
}

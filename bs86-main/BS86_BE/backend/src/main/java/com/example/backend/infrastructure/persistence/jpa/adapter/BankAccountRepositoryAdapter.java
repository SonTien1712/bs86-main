package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.BankAccount;
import com.example.backend.core.repository.BankAccountRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.BankAccountJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.BankAccountMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class BankAccountRepositoryAdapter implements BankAccountRepository {

    private final BankAccountJpaRepository jpa;
    private final BankAccountMapper mapper;

    @Override
    public BankAccount save(BankAccount account) {
        return mapper.toDomain(jpa.save(mapper.toEntity(account)));
    }

    @Override
    public Optional<BankAccount> findById(Long id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<BankAccount> findByMerchantId(Long merchantId) {
        return mapper.toDomainList(jpa.findByMerchantId(merchantId));
    }

    @Override
    public Optional<BankAccount> findDefaultByMerchantId(Long merchantId) {
        return jpa.findByMerchantIdAndIsDefaultTrue(merchantId).map(mapper::toDomain);
    }
}

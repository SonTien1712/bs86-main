package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.WithdrawalRequest;
import com.example.backend.core.enums.WithdrawalStatus;
import com.example.backend.core.repository.WithdrawalRequestRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.WithdrawalRequestJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.WithdrawalRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class WithdrawalRequestRepositoryAdapter implements WithdrawalRequestRepository {

    private final WithdrawalRequestJpaRepository jpa;
    private final WithdrawalRequestMapper mapper;

    @Override
    public WithdrawalRequest save(WithdrawalRequest request) {
        return mapper.toDomain(jpa.save(mapper.toEntity(request)));
    }

    @Override
    public Optional<WithdrawalRequest> findById(Long id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<WithdrawalRequest> findByMerchantId(Long merchantId) {
        return mapper.toDomainList(jpa.findByMerchantId(merchantId));
    }

    @Override
    public List<WithdrawalRequest> findByStatus(WithdrawalStatus status) {
        return mapper.toDomainList(jpa.findByStatus(status));
    }

    @Override
    public List<WithdrawalRequest> findProcessingOlderThan(Long timestampThreshold) {
        return mapper.toDomainList(jpa.findProcessingOlderThan(timestampThreshold));
    }
}

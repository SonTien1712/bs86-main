package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.BankAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountJpaRepository extends JpaRepository<BankAccountEntity, Long> {

    List<BankAccountEntity> findByMerchantId(Long merchantId);

    Optional<BankAccountEntity> findByMerchantIdAndIsDefaultTrue(Long merchantId);
}

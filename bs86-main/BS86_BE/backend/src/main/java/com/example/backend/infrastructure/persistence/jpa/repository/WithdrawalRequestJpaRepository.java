package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.WithdrawalStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.WithdrawalRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WithdrawalRequestJpaRepository extends JpaRepository<WithdrawalRequestEntity, Long> {

    List<WithdrawalRequestEntity> findByMerchantId(Long merchantId);

    List<WithdrawalRequestEntity> findByStatus(WithdrawalStatus status);

    @Query("SELECT w FROM WithdrawalRequestEntity w WHERE w.status = 'PROCESSING' AND w.updatedAt < :threshold")
    List<WithdrawalRequestEntity> findProcessingOlderThan(@Param("threshold") Long threshold);
}

package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.MerchantWalletEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface MerchantWalletJpaRepository extends JpaRepository<MerchantWalletEntity, Long> {

    Optional<MerchantWalletEntity> findByMerchantId(Long merchantId);

    @Modifying
    @Query("UPDATE MerchantWalletEntity w SET w.availableBalance = w.availableBalance - :amount, w.frozenBalance = w.frozenBalance + :amount WHERE w.merchantId = :merchantId AND w.availableBalance >= :amount")
    int lockBalanceForWithdrawal(@Param("merchantId") Long merchantId, @Param("amount") BigDecimal amount);

    @Modifying
    @Query("UPDATE MerchantWalletEntity w SET w.availableBalance = w.availableBalance + :amount WHERE w.merchantId = :merchantId")
    void creditAvailableBalance(@Param("merchantId") Long merchantId, @Param("amount") BigDecimal amount);

    @Modifying
    @Query("UPDATE MerchantWalletEntity w SET w.frozenBalance = w.frozenBalance - :amount WHERE w.merchantId = :merchantId")
    void confirmWithdrawal(@Param("merchantId") Long merchantId, @Param("amount") BigDecimal amount);

    @Modifying
    @Query("UPDATE MerchantWalletEntity w SET w.frozenBalance = w.frozenBalance - :amount, w.availableBalance = w.availableBalance + :amount WHERE w.merchantId = :merchantId")
    void rollbackWithdrawal(@Param("merchantId") Long merchantId, @Param("amount") BigDecimal amount);
}

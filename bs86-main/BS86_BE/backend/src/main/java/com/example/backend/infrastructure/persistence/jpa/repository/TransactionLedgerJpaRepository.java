package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.TransactionLedgerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionLedgerJpaRepository extends JpaRepository<TransactionLedgerEntity, Long> {

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.creditAccountType = :accountType
              and t.creditAccountId = :accountId
              and t.createdAt >= :start
              and t.createdAt < :end
            """)
    BigDecimal sumByAccountAndDate(
            @Param("accountType") String accountType,
            @Param("accountId") Long accountId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.transactionType = :type
              and t.createdAt >= :start
              and t.createdAt < :end
            """)
    BigDecimal sumByTypeAndDateRange(
            @Param("type") String type,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            select t.creditAccountId, coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.creditAccountType = :accountType
              and t.createdAt >= :start
              and t.createdAt < :end
            group by t.creditAccountId
            """)
    List<Object[]> sumByAccountTypeAndDateRange(
            @Param("accountType") String accountType,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.creditAccountType = :accountType
              and t.creditAccountId = :accountId
            """)
    BigDecimal sumCreditsByAccount(
            @Param("accountType") String accountType,
            @Param("accountId") Long accountId);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.debitAccountType = :accountType
              and t.debitAccountId = :accountId
            """)
    BigDecimal sumDebitsByAccount(
            @Param("accountType") String accountType,
            @Param("accountId") Long accountId);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.creditAccountType = :accountType
            """)
    BigDecimal sumCreditsByAccountType(@Param("accountType") String accountType);

    @Query("""
            select coalesce(sum(t.amount), 0)
            from TransactionLedgerEntity t
            where t.debitAccountType = :accountType
            """)
    BigDecimal sumDebitsByAccountType(@Param("accountType") String accountType);
}

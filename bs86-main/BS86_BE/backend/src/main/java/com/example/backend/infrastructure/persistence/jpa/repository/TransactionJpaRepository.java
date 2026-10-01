package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.TransactionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionJpaRepository extends JpaRepository<TransactionEntity, Long> {
    java.util.Optional<TransactionEntity> findByTransactionCode(String transactionCode);

    List<TransactionEntity> findByBooking_Id(Long bookingId);

    java.util.Optional<TransactionEntity> findTopByBooking_IdOrderByCreatedAtDesc(Long bookingId);

    @Query("""
    select t
    from TransactionEntity t
    where t.booking.id in :bookingIds
      and t.createdAt = (
          select max(t2.createdAt)
          from TransactionEntity t2
          where t2.booking.id = t.booking.id
      )
""")
    List<TransactionEntity> findLatestByBookingIds(@Param("bookingIds") List<Long> bookingIds);

    List<TransactionEntity> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<TransactionEntity> findByStatus(TransactionStatus status);

    Page<TransactionEntity> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<TransactionEntity> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, TransactionStatus status, Pageable pageable);

    @Query("""
    select t
    from TransactionEntity t
    where (:status is null or t.status = :status)
      and (:fieldId is null or t.fieldId = :fieldId)
      and (:userId is null or t.userId = :userId)
      and (:fromDate is null or t.createdAt >= :fromDate)
      and (:toDate is null or t.createdAt <= :toDate)
""")
    Page<TransactionEntity> searchAll(
            @Param("status") TransactionStatus status,
            @Param("fieldId") Long fieldId,
            @Param("userId") Long userId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    @Query("""
    select t
    from TransactionEntity t
    where t.ownerProfileId = :ownerProfileId
      and (:status is null or t.status = :status)
      and (:fieldId is null or t.fieldId = :fieldId)
      and (:userId is null or t.userId = :userId)
      and (:fromDate is null or t.createdAt >= :fromDate)
      and (:toDate is null or t.createdAt <= :toDate)
""")
    Page<TransactionEntity> searchByOwner(
            @Param("ownerProfileId") Long ownerProfileId,
            @Param("status") TransactionStatus status,
            @Param("fieldId") Long fieldId,
            @Param("userId") Long userId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}

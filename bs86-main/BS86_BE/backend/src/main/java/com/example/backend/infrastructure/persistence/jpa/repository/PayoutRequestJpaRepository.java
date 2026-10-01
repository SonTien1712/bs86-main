package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.PayoutRequestStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.PayoutRequestEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface PayoutRequestJpaRepository extends JpaRepository<PayoutRequestEntity, Long> {

    Page<PayoutRequestEntity> findByOwnerProfileIdOrderByCreatedAtDesc(Long ownerProfileId, Pageable pageable);

    Page<PayoutRequestEntity> findByOwnerProfileIdAndStatusOrderByCreatedAtDesc(
            Long ownerProfileId,
            PayoutRequestStatus status,
            Pageable pageable);

    Page<PayoutRequestEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<PayoutRequestEntity> findByStatusOrderByCreatedAtDesc(PayoutRequestStatus status, Pageable pageable);

    long countByStatus(PayoutRequestStatus status);

    @Query("""
        select coalesce(sum(p.amount), 0)
        from PayoutRequestEntity p
        where p.ownerProfile.id = :ownerProfileId
          and p.status = :status
    """)
    BigDecimal sumAmountByOwnerProfileIdAndStatus(
            @Param("ownerProfileId") Long ownerProfileId,
            @Param("status") PayoutRequestStatus status
    );

    @Query("""
        select coalesce(sum(p.amount), 0)
        from PayoutRequestEntity p
        where p.ownerProfile.id = :ownerProfileId
          and p.status = :status
          and (:excludedRequestId is null or p.id <> :excludedRequestId)
    """)
    BigDecimal sumAmountByOwnerProfileIdAndStatusExcludingRequest(
            @Param("ownerProfileId") Long ownerProfileId,
            @Param("status") PayoutRequestStatus status,
            @Param("excludedRequestId") Long excludedRequestId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PayoutRequestEntity p where p.id = :id")
    Optional<PayoutRequestEntity> findByIdForUpdate(@Param("id") Long id);
}

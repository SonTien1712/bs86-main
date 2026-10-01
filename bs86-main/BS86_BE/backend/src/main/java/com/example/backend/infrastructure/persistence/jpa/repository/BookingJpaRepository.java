package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.BookingEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingJpaRepository extends JpaRepository<BookingEntity, Long> {
    List<BookingEntity> findByOwnerProfile_IdAndBookingDateAndPaymentStatus(
            Long ownerProfileId,
            LocalDate bookingDate,
            PaymentStatus paymentStatus
    );

    @Query("SELECT b FROM BookingEntity b WHERE b.customer.id = :customerId")
    List<BookingEntity> findByCustomerId(@Param("customerId") Long customerId);

    @EntityGraph(attributePaths = {"court", "court.field"})
    Page<BookingEntity> findByCustomer_Id(Long customerId, Pageable pageable);

    List<BookingEntity> findByCustomer_IdAndBookingStatus(Long customerId, OrderStatus bookingStatus);

    @EntityGraph(attributePaths = {"court", "court.field"})
    Page<BookingEntity> findByCustomer_IdAndBookingStatusIn(Long customerId, List<OrderStatus> bookingStatuses, Pageable pageable);

    List<BookingEntity> findByBookingStatusAndExpiresAtBefore(OrderStatus bookingStatus, LocalDateTime now);

    @Query("""
        SELECT b
        FROM BookingEntity b
        WHERE b.deleted = false
          AND b.bookingStatus = com.example.backend.core.enums.OrderStatus.CONFIRMED
          AND b.paymentStatus = com.example.backend.core.enums.PaymentStatus.PAID
          AND b.bookingDate BETWEEN :fromDate AND :toDate
    """)
    List<BookingEntity> findUpcomingConfirmedBookings(
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );

    @Query("""
    SELECT COALESCE(SUM(b.platformCommission), 0)
    FROM BookingEntity b
    WHERE b.paymentStatus = 'PAID'
""")
    BigDecimal getTotalRevenue();
}

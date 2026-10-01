package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.OrderDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderDetailJpaRepository extends JpaRepository<OrderDetailEntity, Long> {

    @Query("SELECT od FROM OrderDetailEntity od WHERE od.order.id = :orderId")
    List<OrderDetailEntity> findByOrderId(@Param("orderId") Long orderId);

    Optional<OrderDetailEntity> findByCourtSlotId(Long courtSlotId);

    List<OrderDetailEntity> findByCourtId(Long courtId);

    List<OrderDetailEntity> findByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate);

    List<OrderDetailEntity> findByFieldId(Long fieldId);

    @Query("SELECT COALESCE(SUM(od.price), 0) FROM OrderDetailEntity od WHERE od.courtId = :courtId")
    BigDecimal calculateRevenueByCourtId(@Param("courtId") Long courtId);

    @Query("SELECT COALESCE(SUM(od.price), 0) FROM OrderDetailEntity od " +
            "WHERE od.courtId = :courtId " +
            "AND od.bookingDate >= :startDate " +
            "AND od.bookingDate <= :endDate")
    BigDecimal calculateRevenueByCourtIdAndDateRange(
            @Param("courtId") Long courtId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(od.price), 0) FROM OrderDetailEntity od " +
            "JOIN od.order o " +
            "WHERE o.merchantId = :merchantId")
    BigDecimal calculateRevenueByMerchantId(@Param("merchantId") Long merchantId);

    long countByCourtId(Long courtId);

    long countByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate);

    @Query("SELECT od FROM OrderDetailEntity od " +
            "WHERE od.order.customerId = :customerId " +
            "ORDER BY od.bookingDate DESC, od.startTime DESC")
    List<OrderDetailEntity> findByCustomerId(@Param("customerId") Long customerId);
}

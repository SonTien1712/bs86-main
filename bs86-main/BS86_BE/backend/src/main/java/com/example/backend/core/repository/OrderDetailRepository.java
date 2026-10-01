package com.example.backend.core.repository;

import com.example.backend.core.entity.OrderDetail;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface OrderDetailRepository {
        OrderDetail save(OrderDetail orderDetail);

        Optional<OrderDetail> findById(Long id);

        List<OrderDetail> findAll();

        void deleteById(Long id);

        List<OrderDetail> findByOrderId(Long orderId);

        Optional<OrderDetail> findByCourtSlotId(Long courtSlotId);

        List<OrderDetail> findByCourtId(Long courtId);

        List<OrderDetail> findByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate);

        List<OrderDetail> findByFieldId(Long fieldId);

        BigDecimal calculateRevenueByCourtId(Long courtId);

        BigDecimal calculateRevenueByCourtIdAndDateRange(Long courtId, LocalDate startDate, LocalDate endDate);

        BigDecimal calculateRevenueByMerchantId(Long merchantId);

        long countByCourtId(Long courtId);

        long countByCourtIdAndBookingDate(Long courtId, LocalDate bookingDate);

        List<OrderDetail> findByCustomerId(Long customerId);
}
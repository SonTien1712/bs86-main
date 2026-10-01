package com.example.backend.core.repository;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository {
    Booking save(Booking booking);

    Optional<Booking> findById(Long id);

    List<Booking> findAll();

    List<Booking> findByOwnerProfile_IdAndBookingDateAndPaymentStatus(
            Long ownerProfileId,
            LocalDate bookingDate,
            PaymentStatus paymentStatus
    );

    void deleteById(Long id);

    List<Booking> findByCustomerId(Long customerId);

    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    List<Booking> findByCustomerIdAndBookingStatus(Long customerId, OrderStatus bookingStatus);

    Page<Booking> findByCustomerIdAndBookingStatusIn(Long customerId, List<OrderStatus> bookingStatuses, Pageable pageable);

    List<Booking> findExpiredPendingBookings(LocalDateTime now);

    List<Booking> findUpcomingConfirmedBookings(LocalDate fromDate, LocalDate toDate);

    long countBooking();

    BigDecimal getTotalRevenue();
}

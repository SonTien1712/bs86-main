package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.entity.Transaction;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.enums.TransactionStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentFailureCleanupService {

    private final BookingRepository bookingRepository;
    private final CourtSlotRepository courtSlotRepository;
    private final TransactionRepository transactionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void cleanupFailedPaymentCreation(Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId).orElse(null);
        if (booking == null) {
            log.warn("Payment cleanup skipped because booking {} no longer exists", bookingId);
            return;
        }

        log.warn(
                "Cleaning up failed payment creation for booking {}. reason='{}', courtId={}, bookingDate={}, startTime={}, endTime={}, bookingStatus={}, paymentStatus={}",
                booking.getId(),
                reason,
                booking.getCourt() != null ? booking.getCourt().getId() : null,
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getBookingStatus(),
                booking.getPaymentStatus()
        );

        List<CourtSlot> bookingSlots = List.of();
        if (booking.getCourt() != null
                && booking.getCourt().getId() != null
                && booking.getBookingDate() != null
                && booking.getStartTime() != null
                && booking.getEndTime() != null
                && booking.getStartTime().isBefore(booking.getEndTime())) {
            bookingSlots = courtSlotRepository.findByCourtIdAndSlotDateAndTimeRange(
                    booking.getCourt().getId(),
                    booking.getBookingDate(),
                    booking.getStartTime(),
                    booking.getEndTime()
            );
        } else {
            log.warn("Payment cleanup could not resolve slot range for booking {} because booking data is incomplete", bookingId);
        }

        for (CourtSlot slot : bookingSlots) {
            if (slot.getStatus() == SlotStatus.LOCKED) {
                slot.release();
            }
            slot.setHoldExpiredAt(null);
        }
        if (!bookingSlots.isEmpty()) {
            courtSlotRepository.saveAll(bookingSlots);
        }

        for (Transaction transaction : transactionRepository.findByBookingId(bookingId)) {
            if (transaction.getStatus() == TransactionStatus.PENDING) {
                transaction.setStatus(TransactionStatus.FAILED);
                transaction.setResponseMessage(reason);
                transaction.setFailReason(reason);
                transactionRepository.save(transaction);
            }
        }

        if (booking.getPaymentStatus() != PaymentStatus.PAID
                && booking.getBookingStatus() != OrderStatus.CONFIRMED
                && booking.getBookingStatus() != OrderStatus.COMPLETED) {
            booking.setBookingStatus(OrderStatus.CANCELLED);
            booking.setPaymentStatus(PaymentStatus.FAILED);
            booking.setExpiresAt(null);
            bookingRepository.save(booking);
        }
    }
}

package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.entity.User;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface BookingService {
    Booking createBooking(Long customerId, Long courtId, LocalDate bookingDate, List<LocalTime> startTimes);
    Booking createOwnerBooking(User owner, Long courtId, LocalDate bookingDate, List<LocalTime> startTimes);
    Booking getBooking(Long id);
    Booking updateBookingStatus(Long id, String newStatus);
    void cancelBooking(Long id);
    Double calculateTotalPrice(List<CourtSlot> slots);
    boolean checkSlotAvailability(Long courtId, LocalDate date, List<LocalTime> startTimes);
    void confirmPayment(Long bookingId, String paymentReference);
    void cancelBooking(Long bookingId, String reason);

}

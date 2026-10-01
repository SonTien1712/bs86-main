package com.example.backend.core.service;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.enums.OrderStatus;
import com.example.backend.core.enums.PaymentStatus;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtSlotJpaRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingApplicationService {

    private final CourtSlotJpaRepository slotRepo;
    private final BookingRepository bookingRepository;

    @Transactional
    public Booking createBooking(List<Long> slotIds) {

        List<CourtSlotEntity> slots = slotRepo.findAllById(slotIds);

        if (slots.isEmpty()) {
            throw new RuntimeException("No slots found");
        }

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (CourtSlotEntity slot : slots) {

            //K đặt quá khứ
            if (slot.getSlotDate().isBefore(today)) {
                throw new RuntimeException("Cannot book past date");
            }

            //K đặt slot đã qua hoặc đang diễn ra
            if (slot.getSlotDate().isEqual(today)
                    && !slot.getStartTime().isAfter(now)) {

                throw new RuntimeException(
                        "Slot already started or in the past: " + slot.getStartTime());
            }

            //K cho đặt slot đã BOOKED / LOCKED
            if (slot.getStatus() != SlotStatus.AVAILABLE) {
                throw new RuntimeException("Slot not available");
            }

            //Check overlap (nếu user chọn nhiều slot)
            boolean overlap = slotRepo.existsOverlappingSlot(
                    slot.getCourt().getId(),
                    slot.getSlotDate(),
                    slot.getStartTime(),
                    slot.getEndTime()
            );

            if (overlap) {
                throw new RuntimeException("Time overlap detected");
            }
        }

        //Lock slot
        for (CourtSlotEntity slot : slots) {
            slot.setStatus(SlotStatus.LOCKED);
        }

        slotRepo.saveAll(slots);

        //Tạo booking
        Booking booking = new Booking();
        booking.setBookingDate(today);
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setBookingStatus(OrderStatus.PENDING);

        return bookingRepository.save(booking);
    }
}

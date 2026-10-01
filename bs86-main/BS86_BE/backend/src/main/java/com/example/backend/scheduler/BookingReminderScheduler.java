package com.example.backend.scheduler;

import com.example.backend.core.entity.Booking;
import com.example.backend.core.repository.BookingRepository;
import com.example.backend.core.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingReminderScheduler {

    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Value("${notification.reminder.minutes-before:30}")
    private long reminderMinutesBefore;

    @Scheduled(fixedDelayString = "${notification.reminder.fixed-delay-ms:60000}")
    public void pushUpcomingBookingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime reminderThreshold = now.plusMinutes(reminderMinutesBefore);
        List<Booking> candidates = bookingRepository.findUpcomingConfirmedBookings(
                now.toLocalDate(),
                reminderThreshold.toLocalDate()
        );

        int pushed = 0;
        for (Booking booking : candidates) {
            LocalDateTime startAt = booking.getBookingDate() == null || booking.getStartTime() == null
                    ? null
                    : LocalDateTime.of(booking.getBookingDate(), booking.getStartTime());

            if (startAt == null || startAt.isBefore(now) || startAt.isAfter(reminderThreshold)) {
                continue;
            }

            notificationService.notifyUpcomingBookingReminder(booking);
            pushed++;
        }

        if (pushed > 0) {
            log.info("Pushed {} booking reminder notifications", pushed);
        }
    }
}

package com.example.backend.scheduler;

import com.example.backend.core.enums.SlotStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtSlotJpaRepository;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@EnableScheduling
public class SlotStatusScheduler {

    private final CourtSlotJpaRepository slotRepository;

    public SlotStatusScheduler(CourtSlotJpaRepository slotRepository) {
        this.slotRepository = slotRepository;
    }

    @Scheduled(cron = "0 0 1 * * ?")
    public void lockPastSlots() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // Fix #1: dùng đúng method name + đúng type CourtSlotEntity
        List<CourtSlotEntity> pastSlots = slotRepository.findBySlotDateBefore(today);

        for (CourtSlotEntity slot : pastSlots) {
            // Fix #2: dùng SlotStatus enum thay vì String
            if (slot.getSlotDate().isBefore(today)) {
                slot.setStatus(SlotStatus.LOCKED);
                slotRepository.save(slot);
            } else if (slot.getSlotDate().equals(today)
                    && slot.getEndTime().isBefore(now)) {
                slot.setStatus(SlotStatus.LOCKED);
                slotRepository.save(slot);
            }
        }
    }
}
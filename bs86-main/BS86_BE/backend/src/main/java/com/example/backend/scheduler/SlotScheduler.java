package com.example.backend.scheduler;

import com.example.backend.core.entity.Court;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SlotScheduler {

    private final CourtRepository courtRepo;

    private final SlotService slotService;

    @Scheduled(cron = "0 0 0 * * *")
    public void autoGenerateSlots() {

        LocalDate targetDate =
                LocalDate.now().plusDays(14);

        List<Court> courts =
                courtRepo.findAll();

        for (Court court : courts) {

            slotService.generateSlotsInternal(
                    court,
                    targetDate
            );
        }
    }
}
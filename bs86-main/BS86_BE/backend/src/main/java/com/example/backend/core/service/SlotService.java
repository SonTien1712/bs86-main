package com.example.backend.core.service;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.entity.SlotPriceOverride;
import com.example.backend.core.entity.TimeSlotTemplate;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.CourtStatus;
import com.example.backend.core.enums.DayType;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.core.repository.SlotPriceOverrideRepository;
import com.example.backend.core.repository.TimeSlotTemplateRepository;
import com.example.backend.presentation.exception.BusinessException;
import com.example.backend.presentation.exception.CourtTemplateNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotService {

    private static final int MAX_GENERATED_SLOTS_PER_DAY = 2000;

    private final TimeSlotTemplateRepository templateRepo;
    private final CourtSlotRepository slotRepo;
    private final CourtRepository courtRepo;
    private final SlotPriceOverrideRepository overrideRepo;

    @Transactional
    public List<CourtSlot> getSlots(Long courtId, LocalDate date) {

        Court court = courtRepo.findById(courtId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Court not found"));

        List<CourtSlot> slots = slotRepo.findByCourtAndDate(court, date);

        if (slots.isEmpty()) {
            generateSlotsInternal(court, date);
            slots = slotRepo.findByCourtAndDate(court, date);
        }

        long now = System.currentTimeMillis();
        List<CourtSlot> expiredLockedSlots = slots.stream()
                .filter(slot -> slot.getStatus() == SlotStatus.LOCKED)
                .filter(slot -> slot.getHoldExpiredAt() != null && slot.getHoldExpiredAt() <= now)
                .toList();

        for (CourtSlot slot : expiredLockedSlots) {
            slot.release();
        }
        if (!expiredLockedSlots.isEmpty()) {
            slotRepo.saveAll(expiredLockedSlots);
        }

        List<SlotPriceOverride> overrides = overrideRepo.findByCourtIdAndDate(courtId, date);

        Map<LocalTime, SlotPriceOverride> map = overrides.stream()
                .collect(Collectors.toMap(SlotPriceOverride::getStartTime, o -> o));

        for (CourtSlot slot : slots) {
            SlotPriceOverride override = map.get(slot.getStartTime());
            if (override != null) {
                slot.setPrice(BigDecimal.valueOf(override.getOverridePrice()));
            }
        }

        return slots;
    }

    @Transactional
    public void generateSlotsInternal(Court court, LocalDate date) {

        List<CourtSlot> existed = slotRepo.findByCourtAndDate(court, date);
        if (!existed.isEmpty()) {
            return;
        }

        DayType dayType = date.getDayOfWeek().getValue() <= 5
                ? DayType.WEEKDAY
                : DayType.WEEKEND;

        TimeSlotTemplate template = templateRepo.findOneByCourtAndDayType(court, dayType)
                .orElseThrow(() -> new CourtTemplateNotFoundException(court.getId()));

        validateTemplateForGeneration(template);

        LocalTime current = template.getOpenTime();
        List<CourtSlot> slots = new ArrayList<>();

        while (true) {
            LocalTime nextEnd = current.plusMinutes(template.getSlotMinutes());

            // LocalTime wraps after midnight; once nextEnd is before current,
            // the generated slot would spill into the next day and must stop.
            if (nextEnd.isBefore(current) || nextEnd.isAfter(template.getCloseTime())) {
                break;
            }

            CourtSlot slot = CourtSlot.builder()
                    .courtId(court.getId())
                    .slotDate(date)
                    .startTime(current)
                    .endTime(nextEnd)
                    .price(BigDecimal.valueOf(template.getBasePrice()))
                    .status(SlotStatus.AVAILABLE)
                    .build();

            slots.add(slot);

            if (slots.size() > MAX_GENERATED_SLOTS_PER_DAY) {
                throw new BusinessException(
                        HttpStatus.BAD_REQUEST,
                    "Template generates too many slots for one day"
                );
            }

            current = nextEnd;
        }

        slotRepo.saveAll(slots);
    }

    private void validateTemplateForGeneration(TimeSlotTemplate template) {
        if (template.getOpenTime() == null || template.getCloseTime() == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Template time range is incomplete");
        }

        if (!template.getOpenTime().isBefore(template.getCloseTime())) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Template open time must be before close time");
        }

        if (template.getSlotMinutes() <= 0) {
            throw new BusinessException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid slot template: slot minutes must be greater than 0"
            );
        }

    }

    @Transactional
    public void blockSlots(Long courtId, List<Long> slotIds, User owner) {
        Court court = getOwnedCourt(courtId, owner);
        ensureCourtActive(court);

        if (slotIds == null || slotIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "slotIds must not be empty");
        }

        List<Long> normalizedSlotIds = slotIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalizedSlotIds.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "slotIds must not be empty");
        }

        List<CourtSlot> slots = slotRepo.findAllById(normalizedSlotIds);
        if (slots.size() != normalizedSlotIds.size()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "One or more slots were not found");
        }

        for (CourtSlot slot : slots) {
            if (!courtId.equals(slot.getCourtId())) {
                throw new BusinessException(HttpStatus.BAD_REQUEST, "Slot does not belong to this court");
            }
            if (slot.getStatus() == SlotStatus.BOOKED || slot.getStatus() == SlotStatus.LOCKED) {
                throw new BusinessException(HttpStatus.CONFLICT, "Cannot block slot that is already in use");
            }
            slot.setStatus(SlotStatus.BLOCKED);
            slot.setHoldExpiredAt(null);
        }

        slotRepo.saveAll(slots);
    }

    @Transactional
    public void overridePrice(
            Long courtId,
            LocalDate date,
            List<LocalTime> times,
            Long price,
            User owner
    ) {

        Court court = getOwnedCourt(courtId, owner);
        ensureCourtActive(court);

        if (date == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Date is required");
        }

        if (times == null || times.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Times are required");
        }

        List<LocalTime> normalizedTimes = times.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted()
                .toList();

        if (normalizedTimes.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Times are required");
        }

        if (price == null) {
            overrideRepo.deleteByCourtIdAndDateAndStartTimes(courtId, date, normalizedTimes);
            return;
        }

        if (price < 0) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Price must be greater than or equal to 0");
        }

        List<SlotPriceOverride> existingOverrides =
                overrideRepo.findByCourtIdAndDateAndStartTimes(courtId, date, normalizedTimes);

        Map<LocalTime, SlotPriceOverride> existingByTime = new HashMap<>();
        for (SlotPriceOverride existing : existingOverrides) {
            existingByTime.put(existing.getStartTime(), existing);
        }

        for (LocalTime time : normalizedTimes) {
            SlotPriceOverride override = existingByTime.getOrDefault(time, new SlotPriceOverride());
            override.setCourtId(courtId);
            override.setDate(date);
            override.setStartTime(time);
            override.setOverridePrice(price);

            overrideRepo.save(override);
        }
    }

    @Transactional
    public Court updateCourtStatus(Long courtId, String rawStatus, User owner) {
        Court court = getOwnedCourt(courtId, owner);
        CourtStatus status;

        try {
            status = CourtStatus.valueOf(String.valueOf(rawStatus).trim().toUpperCase());
        } catch (Exception ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Unsupported court status");
        }

        court.setStatus(status.name());
        return courtRepo.save(court);
    }

    public Court getOwnedCourt(Long courtId, User owner) {
        Court court = courtRepo.findById(courtId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Court not found"));

        Long ownerId = court.getField() != null
                && court.getField().getOwner() != null
                && court.getField().getOwner().getUser() != null
                ? court.getField().getOwner().getUser().getId()
                : null;

        if (ownerId == null || !ownerId.equals(owner.getId())) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "You can only manage your own courts");
        }

        return court;
    }

    public void ensureCourtActive(Court court) {
        if (court == null) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "Court not found");
        }
        if (!CourtStatus.ACTIVE.name().equalsIgnoreCase(court.getStatus())) {
            throw new BusinessException(HttpStatus.CONFLICT, "Court is currently locked");
        }
    }
}

package com.example.backend.core.repository;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface CourtSlotRepository {

    CourtSlot save(CourtSlot slot);

    List<CourtSlot> saveAll(List<CourtSlot> slots);

    List<CourtSlot> findAllById(List<Long> ids);

    List<CourtSlot> findAllByIdForUpdate(List<Long> ids);

    Optional<CourtSlot> findById(Long id);

    List<CourtSlot> findByCourtAndDate(Court court, LocalDate date);

    boolean existsByCourtIdAndSlotDateAndStartTimeAndStatusNot(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            String excludedStatus
    );

    List<CourtSlot> findByCourtIdAndSlotDate(Long courtId, LocalDate date);

    List<CourtSlot> findByCourtIdAndSlotDateAndTimeRange(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    );

    List<CourtSlot> findByCourtIdAndSlotDateAndTimeRangeForUpdate(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    );

    List<CourtSlot> findExpiredLockedSlots(long timeThreshold);
}

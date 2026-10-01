package com.example.backend.core.repository;

import com.example.backend.core.entity.SlotPriceOverride;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface SlotPriceOverrideRepository {

    SlotPriceOverride save(SlotPriceOverride override);

    Optional<SlotPriceOverride> findById(Long id);

    List<SlotPriceOverride> findAll();

    void deleteById(Long id);

    // 🔥 dùng courtId
    List<SlotPriceOverride> findByCourtIdAndDate(Long courtId, LocalDate date);

    void deleteByCourtIdAndDate(Long courtId, LocalDate date);

    List<SlotPriceOverride> findByCourtIdAndDateAndStartTimes(Long courtId, LocalDate date, List<LocalTime> startTimes);

    void deleteByCourtIdAndDateAndStartTimes(Long courtId, LocalDate date, List<LocalTime> startTimes);
}

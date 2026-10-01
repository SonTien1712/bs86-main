package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.SlotPriceOverrideEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface SlotPriceOverrideJpaRepository
        extends JpaRepository<SlotPriceOverrideEntity, Long> {

    // 🔥 đúng chuẩn Spring Data
    List<SlotPriceOverrideEntity> findByCourt_IdAndDate(
            Long courtId,
            LocalDate date
    );

    void deleteByCourt_IdAndDate(
            Long courtId,
            LocalDate date
    );

    List<SlotPriceOverrideEntity> findByCourt_IdAndDateAndStartTimeIn(
            Long courtId,
            LocalDate date,
            List<LocalTime> startTimes
    );

    void deleteByCourt_IdAndDateAndStartTimeIn(
            Long courtId,
            LocalDate date,
            List<LocalTime> startTimes
    );
}

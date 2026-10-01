package com.example.backend.core.repository;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.TimeSlotTemplate;
import com.example.backend.core.enums.DayType;

import java.util.List;
import java.util.Optional;

public interface TimeSlotTemplateRepository {

    boolean existsByCourtIdAndDayType(
            Long courtId,
            DayType dayType
    );

    Optional<TimeSlotTemplate> findOneByCourtAndDayType(
            Court court,
            DayType dayType
    );

    TimeSlotTemplate save(TimeSlotTemplate template);

    void deleteByCourtAndDayType(
            Court court,
            DayType dayType
    );
}


package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.DayType;
import com.example.backend.infrastructure.persistence.jpa.entity.TimeSlotTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TimeSlotTemplateJpaRepository
        extends JpaRepository<TimeSlotTemplateEntity, Long> {

    boolean existsByCourtIdAndDayType(
            Long courtId,
            DayType dayType
    );

    Optional<TimeSlotTemplateEntity> findByCourtIdAndDayType(
            Long courtId,
            DayType dayType
    );

    void deleteByCourtIdAndDayType(
            Long courtId,
            DayType dayType
    );
}

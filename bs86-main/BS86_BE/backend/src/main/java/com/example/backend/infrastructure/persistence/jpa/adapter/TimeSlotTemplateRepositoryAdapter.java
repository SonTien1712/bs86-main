package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.TimeSlotTemplate;
import com.example.backend.core.enums.DayType;
import com.example.backend.core.repository.TimeSlotTemplateRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.TimeSlotTemplateEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.TimeSlotTemplateJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.CourtMapper;
import com.example.backend.infrastructure.persistence.mapper.TimeSlotTemplateMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimeSlotTemplateRepositoryAdapter
        implements TimeSlotTemplateRepository {

    private final TimeSlotTemplateJpaRepository repo;
    private final TimeSlotTemplateMapper mapper;
    private final CourtMapper courtMapper;

    @Override
    public boolean existsByCourtIdAndDayType(
            Long courtId,
            DayType dayType
    ) {

        if (courtId == null || dayType == null) {
            return false;
        }

        return repo.existsByCourtIdAndDayType(courtId, dayType);
    }

    @Override
    public Optional<TimeSlotTemplate> findOneByCourtAndDayType(
            Court court,
            DayType dayType
    ) {

        if (court == null) {
            return Optional.empty();
        }

        return repo
                .findByCourtIdAndDayType(
                        court.getId(),
                        dayType
                )
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public TimeSlotTemplate save(TimeSlotTemplate template) {

        if (template == null) {
            return null;
        }

        TimeSlotTemplateEntity entity =
                mapper.toEntity(template);

        if (template.getCourt() != null) {
            entity.setCourt(
                    courtMapper.toEntity(
                            template.getCourt()
                    )
            );
        }

        TimeSlotTemplateEntity saved =
                repo.save(entity);

        return toDomain(saved);
    }

    @Override
    public void deleteByCourtAndDayType(
            Court court,
            DayType dayType
    ) {

        if (court == null) {
            return;
        }

        repo.deleteByCourtIdAndDayType(
                court.getId(),
                dayType
        );
    }

    private TimeSlotTemplate toDomain(
            TimeSlotTemplateEntity entity
    ) {

        if (entity == null) {
            return null;
        }

        TimeSlotTemplate domain =
                mapper.toDomain(entity);

        if (entity.getCourt() != null) {
            Court court = new Court();
            court.setId(entity.getCourt().getId());
            domain.setCourt(court);
        }

        return domain;
    }
}

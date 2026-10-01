package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.SlotPriceOverride;
import com.example.backend.core.repository.SlotPriceOverrideRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.SlotPriceOverrideEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.SlotPriceOverrideJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.CourtMapper;
import com.example.backend.infrastructure.persistence.mapper.SlotPriceOverrideMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SlotPriceOverrideRepositoryAdapter
        implements SlotPriceOverrideRepository {

    private final SlotPriceOverrideJpaRepository repo;
    private final SlotPriceOverrideMapper mapper;

    @Override
    public SlotPriceOverride save(SlotPriceOverride override) {

        SlotPriceOverrideEntity entity = mapper.toEntity(override);

        // set court từ courtId
        CourtEntity court = new CourtEntity();
        court.setId(override.getCourtId());
        entity.setCourt(court);

        return mapper.toDomain(repo.save(entity));
    }

    @Override
    public List<SlotPriceOverride> findByCourtIdAndDate(
            Long courtId,
            LocalDate date
    ) {

        return repo.findByCourt_IdAndDate(courtId, date)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteByCourtIdAndDate(
            Long courtId,
            LocalDate date
    ) {

        repo.deleteByCourt_IdAndDate(courtId, date);
    }

    @Override
    public List<SlotPriceOverride> findByCourtIdAndDateAndStartTimes(
            Long courtId,
            LocalDate date,
            List<LocalTime> startTimes
    ) {

        return repo.findByCourt_IdAndDateAndStartTimeIn(courtId, date, startTimes)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteByCourtIdAndDateAndStartTimes(
            Long courtId,
            LocalDate date,
            List<LocalTime> startTimes
    ) {

        repo.deleteByCourt_IdAndDateAndStartTimeIn(courtId, date, startTimes);
    }

    @Override
    public Optional<SlotPriceOverride> findById(Long id) {
        return repo.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<SlotPriceOverride> findAll() {
        return repo.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(Long id) {
        repo.deleteById(id);
    }
}


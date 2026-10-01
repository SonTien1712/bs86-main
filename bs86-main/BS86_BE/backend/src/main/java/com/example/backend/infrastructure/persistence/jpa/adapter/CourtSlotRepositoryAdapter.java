package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.CourtSlot;
import com.example.backend.core.enums.SlotStatus;
import com.example.backend.core.repository.CourtSlotRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtSlotEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtSlotJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.CourtSlotPersistenceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class CourtSlotRepositoryAdapter implements CourtSlotRepository {

    private final CourtSlotJpaRepository jpa;
    private final CourtSlotPersistenceMapper mapper;

    @Override
    public CourtSlot save(CourtSlot slot) {
        CourtSlotEntity entity = mapper.toEntity(slot);

        CourtEntity court = new CourtEntity();
        court.setId(slot.getCourtId());
        entity.setCourt(court);

        CourtSlotEntity saved = jpa.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<CourtSlot> saveAll(List<CourtSlot> slots) {
        List<CourtSlotEntity> entities = slots.stream()
                .map(slot -> {
                    CourtSlotEntity entity = mapper.toEntity(slot);

                    CourtEntity court = new CourtEntity();
                    court.setId(slot.getCourtId());
                    entity.setCourt(court);

                    return entity;
                })
                .toList();

        return jpa.saveAll(entities)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CourtSlot> findAllById(List<Long> ids) {
        return mapper.toDomainList(jpa.findAllById(ids));
    }

    @Override
    public List<CourtSlot> findAllByIdForUpdate(List<Long> ids) {
        return mapper.toDomainList(jpa.findAllByIdForUpdate(ids));
    }

    @Override
    public Optional<CourtSlot> findById(Long id) {
        return jpa.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<CourtSlot> findByCourtAndDate(Court court, LocalDate date) {
        return mapper.toDomainList(jpa.findByCourt_IdAndSlotDate(court.getId(), date));
    }

    @Override
    public boolean existsByCourtIdAndSlotDateAndStartTimeAndStatusNot(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            String excludedStatus
    ) {
        return jpa.existsByCourtIdAndSlotDateAndStartTimeAndStatusNot(
                courtId,
                date,
                startTime,
                SlotStatus.valueOf(excludedStatus)
        );
    }

    @Override
    public List<CourtSlot> findByCourtIdAndSlotDate(Long courtId, LocalDate date) {
        return jpa.findByCourt_IdAndSlotDate(courtId, date)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourtSlot> findByCourtIdAndSlotDateAndTimeRange(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return jpa.findByCourtIdAndSlotDateAndTimeRange(courtId, date, startTime, endTime)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourtSlot> findByCourtIdAndSlotDateAndTimeRangeForUpdate(
            Long courtId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime
    ) {
        return jpa.findByCourtIdAndSlotDateAndTimeRangeForUpdate(courtId, date, startTime, endTime)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<CourtSlot> findExpiredLockedSlots(long timeThreshold) {
        return jpa.findExpiredLockedSlots(timeThreshold)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}

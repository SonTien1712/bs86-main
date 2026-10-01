package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Court;
import com.example.backend.core.entity.Field;
import com.example.backend.core.repository.CourtRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.CourtEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CourtJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.CourtMapper;
import com.example.backend.infrastructure.persistence.mapper.FieldMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourtRepositoryAdapter implements CourtRepository {

    private final CourtJpaRepository courtJpaRepository;
    private final CourtMapper courtMapper;
    private final FieldMapper fieldMapper;

    @Override
    @Transactional
    public Court save(Court court) {
        CourtEntity entity = courtMapper.toEntity(court);
        if (court.getField() != null && court.getField().getId() != null) {
            FieldEntity fieldRef = new FieldEntity();
            fieldRef.setId(court.getField().getId());
            entity.setField(fieldRef);
        }
        CourtEntity saved = courtJpaRepository.save(entity);
        return mapToDomainSafe(saved);
    }

    @Override
    public Optional<Court> findById(Long id) {
        return courtJpaRepository.findById(id).map(this::mapToDomainSafe);
    }

    @Override
    public List<Court> findAll() {
        return courtJpaRepository.findAll().stream().map(this::mapToDomainSafe).collect(Collectors.toList());
    }

    @Override
    public boolean existsByFieldAndCourtNumber(Field field, Integer courtNumber) {
        if (field == null || field.getId() == null) {
            return false;
        }

        return courtJpaRepository.existsByFieldIdAndCourtNumber(field.getId(), courtNumber);
    }

    @Override
    public List<Court> findByFieldId(Long fieldId) {
        return courtJpaRepository.findByFieldId(fieldId).stream().map(this::mapToDomainForFieldList)
                .collect(Collectors.toList());
    }

    @Override
    public List<Court> findAvailableCourtsByDate(LocalDate date) {
        return courtJpaRepository.findAllActive().stream()
                .map(this::mapToDomainSafe)
                .collect(Collectors.toList());
    }

    private Court mapToDomainSafe(CourtEntity entity) {
        if (entity == null)
            return null;
        Court domain = courtMapper.toDomain(entity);
        if (entity.getField() != null) {
            domain.setField(fieldMapper.toDomain(entity.getField()));
        }
        return domain;
    }

    private Court mapToDomainForFieldList(CourtEntity entity) {
        if (entity == null) {
            return null;
        }

        Court domain = courtMapper.toDomain(entity);

        if (entity.getField() != null) {
            Field field = new Field();
            field.setId(entity.getField().getId());
            domain.setField(field);
        }

        return domain;
    }
}

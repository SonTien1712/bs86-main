package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Field;
import com.example.backend.core.enums.FieldStatus;
import com.example.backend.core.repository.FieldRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.FieldMapper;
import com.example.backend.presentation.dto.response.FieldMarkerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FieldRepositoryAdapter implements FieldRepository {

    private final FieldJpaRepository fieldJpaRepository;
    private final FieldMapper fieldMapper;
    private final OwnerProfileJpaRepository ownerProfileJpaRepository;

    @Override
    @Transactional
    public Field save(Field field) {
        FieldEntity entity = fieldMapper.toEntity(field);

        if (entity.getVerification() != null) {
            entity.getVerification().setField(entity);
        }
        if (entity.getDetail() != null) {
            entity.getDetail().setField(entity);
        }
        if (entity.getOwner() != null && entity.getOwner().getId() != null) {
            entity.setOwner(ownerProfileJpaRepository.getReferenceById(entity.getOwner().getId()));
        }

        FieldEntity saved = fieldJpaRepository.save(entity);

        System.out.println(">>> FIELD SAVED TO DB: " + saved.getName());

        return mapToDomainSafe(saved);
    }

    @Override
    public Optional<Field> findById(Long id) {
        return fieldJpaRepository.findById(id).map(this::mapToDomainSafe);
    }

    @Override
    public Optional<Field> findBySlug(String slug) {
        return fieldJpaRepository.findBySlug(slug).map(this::mapToDomainSafe);
    }

    @Override
    public List<Field> findAll() {
        return fieldJpaRepository.findAll().stream().map(this::mapToDomainSafe).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        fieldJpaRepository.deleteById(id);
    }

    @Override
    public List<Field> findByStatus(FieldStatus status) {
        return fieldJpaRepository.findByStatus(status).stream().map(this::mapToDomainSafe).collect(Collectors.toList());
    }

    @Override
    public List<Field> findByOwnerId(Long ownerId) {
        return fieldJpaRepository.findByOwnerId(ownerId).stream().map(this::mapToDomainSafe)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsBySlug(String slug) {
        return fieldJpaRepository.existsBySlug(slug);
    }

    @Override
    public List<FieldMarkerResponse> findMarkersInBox(
            FieldStatus status,
            String sportType,
            double minLat,
            double maxLat,
            double minLng,
            double maxLng
    ) {
        return fieldJpaRepository.findMarkersInBox(status, sportType, minLat, maxLat, minLng, maxLng);
    }

    @Override
    public List<Field> findByOwner_User_Id(Long userId) {
        return fieldJpaRepository.findByOwner_User_Id(userId)
                .stream()
                .map(this::mapToDomainSafe)
                .collect(Collectors.toList());
    }

    private Field mapToDomainSafe(FieldEntity entity) {
        if (entity == null) {
            return null;
        }

        Field domain = fieldMapper.toDomain(entity);
        if (domain.getVerification() != null) {
            domain.getVerification().setField(domain);
        }
        if (domain.getDetail() != null && domain.getDetail().getFieldId() == null) {
            domain.getDetail().setFieldId(domain.getId());
        }
        return domain;
    }

    @Override
    public long countField() {
        return fieldJpaRepository.count();
    }
}

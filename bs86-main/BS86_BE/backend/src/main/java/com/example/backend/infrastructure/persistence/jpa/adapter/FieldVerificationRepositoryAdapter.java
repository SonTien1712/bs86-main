package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.FieldVerification;
import com.example.backend.core.repository.FieldVerificationRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.FieldVerificationEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.FieldVerificationJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.FieldMapper;
import com.example.backend.infrastructure.persistence.mapper.FieldVerificationMapper;
import com.example.backend.core.enums.VerificationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FieldVerificationRepositoryAdapter implements FieldVerificationRepository {

    private final FieldVerificationJpaRepository repo;
    private final FieldVerificationMapper mapper;
    private final FieldMapper fieldMapper;
    private final FieldJpaRepository fieldJpaRepository; // ✅ thêm để lấy managed reference

    @Override
    public FieldVerification save(FieldVerification verification) {
        FieldVerificationEntity entity = mapper.toEntity(verification);

        // ✅ FIX: Dùng getReferenceById để lấy managed Hibernate proxy
        // thay vì fieldMapper.toEntity() tạo ra detached entity gây TransientPropertyValueException
        if (verification.getField() != null && verification.getField().getId() != null) {
            entity.setField(fieldJpaRepository.getReferenceById(verification.getField().getId()));
        }

        FieldVerificationEntity saved = repo.save(entity);
        return mapToDomainSafe(saved);
    }

    @Override
    public Optional<FieldVerification> findById(Long id) {
        return repo.findById(id).map(this::mapToDomainSafe);
    }

    @Override
    public Optional<FieldVerification> findByFieldId(Long fieldId) {
        return repo.findByFieldId(fieldId).map(this::mapToDomainSafe);
    }

    private FieldVerification mapToDomainSafe(FieldVerificationEntity entity) {
        if (entity == null)
            return null;
        FieldVerification domain = mapper.toDomain(entity);
        if (entity.getField() != null) {
            domain.setField(fieldMapper.toDomain(entity.getField()));
        }
        return domain;
    }

    @Override
    public List<FieldVerification> findByStatus(VerificationStatus status) {
        return repo.findByStatus(status).stream()
                .map(this::mapToDomainSafe)
                .collect(Collectors.toList());
    }

    @Override
    public long countByStatus(VerificationStatus status) {
        return repo.count();
    }
}


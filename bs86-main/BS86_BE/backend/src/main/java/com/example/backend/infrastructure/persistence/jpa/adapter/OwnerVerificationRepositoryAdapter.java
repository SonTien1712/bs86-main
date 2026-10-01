package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.core.entity.User;
import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.core.repository.OwnerVerificationRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerVerificationEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerVerificationJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.OwnerVerificationMapper;
import com.example.backend.infrastructure.persistence.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class OwnerVerificationRepositoryAdapter implements OwnerVerificationRepository {

    private final OwnerVerificationJpaRepository jpaRepository;
    private final OwnerProfileJpaRepository ownerProfileJpaRepository;
    private final OwnerVerificationMapper mapper;
    private final UserMapper userMapper;

    @Override
    public OwnerVerification save(OwnerVerification verification) {

        if (verification.getOwner() == null || verification.getOwner().getId() == null) {
            throw new IllegalArgumentException("OwnerVerification.owner must not be null");
        }

        OwnerVerificationEntity entity;

        if (verification.getId() != null) {
            // UPDATE path: load the managed entity and mutate it directly.
            // Avoids detached-entity merge conflicts when Hibernate already has
            // a managed instance in the session (e.g. loaded by findByIdWithOwner).
            entity = jpaRepository.findById(verification.getId())
                    .orElseThrow(() -> new RuntimeException(
                            "OwnerVerification not found for ID: " + verification.getId()));

            entity.setStatus(verification.getStatus());
            entity.setIdCardNumber(verification.getIdCardNumber());
            entity.setIdCardFrontUrl(verification.getIdCardFrontUrl());
            entity.setIdCardBackUrl(verification.getIdCardBackUrl());
            entity.setBusinessLicenseUrl(verification.getBusinessLicenseUrl());
            entity.setRejectionReason(verification.getRejectionReason());
            entity.setRejectedAt(verification.getRejectedAt());
            entity.setAttemptCount(verification.getAttemptCount());
            // owner FK is already correct — do NOT overwrite it
        } else {
            // INSERT path: brand-new record, fetch and attach the owner.
            entity = mapper.toEntity(verification);

            OwnerProfileEntity ownerEntity = ownerProfileJpaRepository
                    .findById(verification.getOwner().getId())
                    .orElseThrow(() -> new RuntimeException(
                            "OwnerProfile not found for ID: " + verification.getOwner().getId()));

            entity.setOwner(ownerEntity);
        }

        OwnerVerificationEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<OwnerVerification> findById(Long id) {
        return jpaRepository.findByIdWithOwner(id).map(this::toDomainWithOwner);
    }

    @Override
    public Optional<OwnerVerification> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId).map(mapper::toDomain);
    }

    @Override
    public List<OwnerVerification> findByStatus(VerificationStatus status) {
        return jpaRepository.findByStatusWithOwner(status)
                .stream()
                .map(this::toDomainWithOwner)
                .collect(Collectors.toList());
    }

    private OwnerVerification toDomainWithOwner(OwnerVerificationEntity entity) {
        OwnerVerification domain = mapper.toDomain(entity);

        OwnerProfileEntity ownerEntity = entity.getOwner();
        if (ownerEntity != null) {
            OwnerProfile ownerProfile = new OwnerProfile();
            ownerProfile.setId(ownerEntity.getId());
            ownerProfile.setBankName(ownerEntity.getBankName());
            ownerProfile.setBankAccountNumber(ownerEntity.getBankAccountNumber());
            ownerProfile.setBankAccountHolder(ownerEntity.getBankAccountHolder());
            ownerProfile.setPayoutEnabled(ownerEntity.isPayoutEnabled());

            if (ownerEntity.getUser() != null) {
                User user = userMapper.toDomain(ownerEntity.getUser());
                ownerProfile.setUser(user);
            }

            domain.setOwner(ownerProfile);
        }

        return domain;
    }

    @Override
    public long countByStatus(VerificationStatus status) {
        return jpaRepository.countByStatus(status);
    }
}
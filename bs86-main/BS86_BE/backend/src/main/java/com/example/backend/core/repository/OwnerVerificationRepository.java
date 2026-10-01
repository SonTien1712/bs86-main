package com.example.backend.core.repository;

import com.example.backend.core.entity.OwnerVerification;
import com.example.backend.core.enums.UserStatus;
import com.example.backend.core.enums.VerificationStatus;

import java.util.List;
import java.util.Optional;

public interface OwnerVerificationRepository {
    OwnerVerification save(OwnerVerification verification);

    Optional<OwnerVerification> findById(Long id);

    Optional<OwnerVerification> findByOwnerId(Long ownerId);

    List<OwnerVerification> findByStatus(VerificationStatus status);

    long countByStatus(VerificationStatus status);
}

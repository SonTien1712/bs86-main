package com.example.backend.core.repository;

import com.example.backend.core.entity.FieldVerification;
import com.example.backend.core.enums.VerificationStatus;

import java.util.List;
import java.util.Optional;

public interface FieldVerificationRepository {

    FieldVerification save(FieldVerification verification);

    Optional<FieldVerification> findById(Long id);

    Optional<FieldVerification> findByFieldId(Long fieldId);

    List<FieldVerification> findByStatus(VerificationStatus status);

    long countByStatus(VerificationStatus status);
}

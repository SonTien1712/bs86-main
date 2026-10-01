package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.FieldVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FieldVerificationJpaRepository extends JpaRepository<FieldVerificationEntity, Long> {

    Optional<FieldVerificationEntity> findByFieldId(Long fieldId);

    java.util.List<FieldVerificationEntity> findByStatus(com.example.backend.core.enums.VerificationStatus status);
}

package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.OtpType;
import com.example.backend.infrastructure.persistence.jpa.entity.OtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface OtpJpaRepository extends JpaRepository<OtpEntity, Long> {
    Optional<OtpEntity> findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(String email, String otpCode, OtpType type, LocalDateTime now);
    void deleteByEmailAndType(String email, OtpType type);
    void deleteByExpiresAtBefore(LocalDateTime time);
}

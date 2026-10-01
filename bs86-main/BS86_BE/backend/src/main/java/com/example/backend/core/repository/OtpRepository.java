package com.example.backend.core.repository;

import com.example.backend.core.entity.Otp;
import com.example.backend.core.enums.OtpType;

import java.time.LocalDateTime;
import java.util.Optional;

// OtpRepository.java
public interface OtpRepository {
    void save(Otp otp);  // ✅ chỉ 1 tham số
    void invalidateAllForEmail(String email, OtpType type);
    Optional<Otp> findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(
            String email, String otpCode, OtpType type, LocalDateTime now);
}

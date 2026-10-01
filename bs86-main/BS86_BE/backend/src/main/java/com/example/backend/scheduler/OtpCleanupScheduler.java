package com.example.backend.scheduler;

import com.example.backend.infrastructure.persistence.jpa.repository.OtpJpaRepository;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@EnableScheduling
public class OtpCleanupScheduler {

    private final OtpJpaRepository otpJpaRepository;

    public OtpCleanupScheduler(OtpJpaRepository otpJpaRepository) {
        this.otpJpaRepository = otpJpaRepository;
    }

    @Scheduled(cron = "0 0 * * * *") // mỗi giờ
    public void cleanExpiredOtps() {
        otpJpaRepository.deleteByExpiresAtBefore(LocalDateTime.now());
    }
}

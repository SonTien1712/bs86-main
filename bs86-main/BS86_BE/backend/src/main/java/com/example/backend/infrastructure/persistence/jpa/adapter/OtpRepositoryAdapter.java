package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.Otp;
import com.example.backend.core.enums.OtpType;
import com.example.backend.core.repository.OtpRepository;
import com.example.backend.infrastructure.persistence.jpa.repository.OtpJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.OtpMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Optional;

@Component

public class OtpRepositoryAdapter implements OtpRepository {

    private final OtpJpaRepository jpaRepository;
    private final OtpMapper mapper;

    public OtpRepositoryAdapter(OtpJpaRepository jpaRepository, OtpMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public void save(Otp otp) {
        jpaRepository.save(mapper.toEntity(otp));
    }

    @Override
    // ✅ Đổi Otp.OtpType → OtpType
    public Optional<Otp> findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(
            String email, String code, OtpType type, LocalDateTime now) {
        return jpaRepository
                .findByEmailAndOtpCodeAndTypeAndUsedFalseAndExpiresAtAfter(email, code, type, now)
                .map(mapper::toDomain);
    }

    @Override
    // ✅ Đổi Otp.OtpType → OtpType, bỏ OtpType.valueOf() thừa
    public void invalidateAllForEmail(String email, OtpType type) {
        jpaRepository.deleteByEmailAndType(email, type);
    }
}

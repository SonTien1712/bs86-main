package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.OwnerProfile;
import com.example.backend.core.entity.User;
import com.example.backend.core.repository.OwnerProfileRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.OwnerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.OwnerProfileMapper;
import com.example.backend.infrastructure.persistence.mapper.UserMapper;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OwnerProfileRepositoryAdapter implements OwnerProfileRepository {

    private final OwnerProfileJpaRepository jpaRepository;
    private final OwnerProfileMapper mapper;
    private final UserMapper userMapper;

    @Override
    @Transactional
    public OwnerProfile save(OwnerProfile profile) {
        OwnerProfileEntity entity;

        if (profile.getId() != null) {
            // Update the managed entity directly so Hibernate does not try to
            // merge a detached verification graph with a null owner reference.
            entity = jpaRepository.findById(profile.getId())
                    .orElseThrow(() -> new RuntimeException(
                            "OwnerProfile not found for ID: " + profile.getId()));

            entity.setBankName(profile.getBankName());
            entity.setBankAccountNumber(profile.getBankAccountNumber());
            entity.setBankAccountHolder(profile.getBankAccountHolder());
            entity.setPayoutEnabled(profile.isPayoutEnabled());
        } else {
            entity = mapper.toEntity(profile);
        }

        OwnerProfileEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<OwnerProfile> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<OwnerProfile> findByUser(User user) {

        Optional<OwnerProfileEntity> entityOpt =
                jpaRepository.findByUser(userMapper.toEntity(user));

        if (entityOpt.isEmpty()) {
            return Optional.empty();
        }

        OwnerProfileEntity entity = entityOpt.get();

        if (entity.getUser() != null) {
            entity.getUser().getEmail();
        }

        return Optional.of(mapper.toDomain(entity));
    }

    // Implement 2 hàm mới
    @Override
    public Optional<OwnerProfile> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Optional<OwnerProfile> findByUserEmail(String email) {
        // Lưu ý: Tên hàm findByUser_Email có thể khác đôi chút tùy vào cách bạn đặt tên thuộc tính trong OwnerProfileEntity
        return jpaRepository.findByUser_Email(email).map(mapper::toDomain);
    }
}

package com.example.backend.infrastructure.persistence.jpa.adapter;

import com.example.backend.core.entity.CustomerProfile;
import com.example.backend.core.repository.CustomerProfileRepository;
import com.example.backend.infrastructure.persistence.jpa.entity.CustomerProfileEntity;
import com.example.backend.infrastructure.persistence.jpa.repository.CustomerProfileJpaRepository;
import com.example.backend.infrastructure.persistence.mapper.CustomerProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class CustomerProfileRepositoryAdapter implements CustomerProfileRepository {

    private final CustomerProfileJpaRepository jpaRepository;
    private final CustomerProfileMapper mapper;

    @Override
    public CustomerProfile save(CustomerProfile profile) {
        CustomerProfileEntity entity = mapper.toEntity(profile);
        if (profile.getUser() != null && profile.getUser().getId() != null) {
            com.example.backend.infrastructure.persistence.jpa.entity.UserEntity userEntity = new com.example.backend.infrastructure.persistence.jpa.entity.UserEntity();
            userEntity.setId(profile.getUser().getId());
            entity.setUser(userEntity);
        }
        CustomerProfileEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<CustomerProfile> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<CustomerProfile> findByUserId(Long userId) {
        return jpaRepository.findByUserId(userId).map(mapper::toDomain);
    }
}

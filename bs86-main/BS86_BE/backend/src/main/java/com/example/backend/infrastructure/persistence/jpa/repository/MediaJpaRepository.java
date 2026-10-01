package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.OwnerType;
import com.example.backend.infrastructure.persistence.jpa.entity.MediaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaJpaRepository extends JpaRepository<MediaEntity, Long> {
    List<MediaEntity> findByOwnerTypeAndOwnerId(OwnerType ownerType, Long ownerId);
}

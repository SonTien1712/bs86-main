package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.infrastructure.persistence.jpa.entity.CheckInLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CheckInLogJpaRepository extends JpaRepository<CheckInLogEntity, Long> {
    List<CheckInLogEntity> findTop100ByOwner_IdOrderByCheckInTimeDesc(Long ownerId);
}

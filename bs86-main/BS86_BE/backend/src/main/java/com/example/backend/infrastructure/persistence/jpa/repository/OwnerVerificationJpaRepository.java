package com.example.backend.infrastructure.persistence.jpa.repository;

import com.example.backend.core.enums.VerificationStatus;
import com.example.backend.infrastructure.persistence.jpa.entity.OwnerVerificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OwnerVerificationJpaRepository extends JpaRepository<OwnerVerificationEntity, Long> {
    Optional<OwnerVerificationEntity> findByOwnerId(Long ownerId);

    @Query("SELECT v FROM OwnerVerificationEntity v JOIN FETCH v.owner o JOIN FETCH o.user WHERE v.status = :status")
    List<OwnerVerificationEntity> findByStatusWithOwner(@Param("status") VerificationStatus status);

    @Query("SELECT v FROM OwnerVerificationEntity v JOIN FETCH v.owner o JOIN FETCH o.user WHERE v.id = :id")
    Optional<OwnerVerificationEntity> findByIdWithOwner(@Param("id") Long id);

    List<OwnerVerificationEntity> findByStatus(VerificationStatus status);

    long countByStatus(VerificationStatus status);
}
